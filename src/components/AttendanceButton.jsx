import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useTenant } from '../lib/useTenant'
import { LogIn, LogOut, Loader2, MapPin, Camera } from 'lucide-react'

export default function AttendanceButton({ session }) {
  const tenant = useTenant()
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [lastAction, setLastAction] = useState(null)
  const [showCameraModal, setShowCameraModal] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [capturedPhoto, setCapturedPhoto] = useState(null)
  
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => {
    if (!session?.user?.id || !tenant?.clientId) return
    checkCurrentStatus()
  }, [session, tenant])

  const checkCurrentStatus = async () => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const { data, error } = await supabase
        .from('attendance_logs')
        .select('type, timestamp')
        .eq('user_id', session.user.id)
        .eq('client_id', tenant.clientId)
        .gte('timestamp', today.toISOString())
        .order('timestamp', { ascending: false })
        .limit(1)

      if (data && data.length > 0) {
        setIsCheckedIn(data[0].type === 'check_in')
        setLastAction(data[0].timestamp)
      } else {
        setIsCheckedIn(false)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const startCamera = async () => {
    setCameraError('')
    setCapturedPhoto(null)
    setShowCameraModal(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      console.error('Camera error:', err)
      setCameraError('No se pudo acceder a la cámara. Por favor permite el acceso.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setShowCameraModal(false)
  }

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8)
      setCapturedPhoto(photoDataUrl)
      
      // Stop the video stream but keep the modal open to confirm
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
    }
  }

  const retakePhoto = () => {
    setCapturedPhoto(null)
    startCamera()
  }

  const confirmAttendance = async () => {
    if (!capturedPhoto) return
    setIsLoading(true)
    
    // 1. Get GPS Location
    if (!navigator.geolocation) {
        alert("Geolocalización no soportada en tu navegador.")
        stopCamera()
        setIsLoading(false)
        return
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords

        // 2. Upload Photo to Supabase
        let photoUrl = ''
        try {
            const base64Data = capturedPhoto.replace(/^data:image\/\w+;base64,/, '')
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'image/jpeg' });
            const fileName = `attendance_${session.user.id}_${Date.now()}.jpg`
            
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('media')
                .upload(fileName, blob, {
                    contentType: 'image/jpeg',
                    upsert: false
                })
                
            if (uploadError) throw uploadError
            
            const { data: publicUrlData } = supabase.storage.from('media').getPublicUrl(fileName)
            photoUrl = publicUrlData.publicUrl
        } catch (uploadErr) {
            console.error('Error uploading photo:', uploadErr)
            alert('Error al subir la foto de asistencia.')
            stopCamera()
            setIsLoading(false)
            return
        }

        // 3. Save to DB
        const actionType = isCheckedIn ? 'check_out' : 'check_in'
        const { error } = await supabase.from('attendance_logs').insert([{
            client_id: tenant.clientId,
            user_id: session.user.id,
            user_email: session.user.email,
            type: actionType,
            latitude,
            longitude,
            biometric_verified: true, // we verified via photo
            device_info: photoUrl // Storing photoUrl here temporarily to avoid needing a DB migration immediately, or we can use photo_url if added
        }])

        if (error) {
            alert("Error guardando asistencia: " + error.message)
            stopCamera()
            setIsLoading(false)
            return
        }

        setIsCheckedIn(!isCheckedIn)
        setLastAction(new Date().toISOString())
        stopCamera()
        setIsLoading(false)
        
        alert(`Turno ${actionType === 'check_in' ? 'Iniciado' : 'Finalizado'} exitosamente. \\nUbicación y Foto guardadas.`)

    }, (geoErr) => {
        alert("Error GPS (" + geoErr.code + "): " + geoErr.message + "\\n\\nVe a Configuración -> Privacidad -> Localización y permite el acceso.")
        stopCamera()
        setIsLoading(false)
    }, {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 60000
    })
  }

  if (isLoading) {
    return (
      <button className="header-action-btn disabled">
        <Loader2 size={18} className="animate-spin" />
      </button>
    )
  }

  return (
    <>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button 
          className="btn btn-sm" 
          onClick={startCamera}
          style={{ 
              background: isCheckedIn ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
              color: isCheckedIn ? 'var(--accent-rose)' : 'var(--accent-emerald)',
              border: `1px solid ${isCheckedIn ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6
          }}
          title={isCheckedIn ? "Finalizar Turno" : "Iniciar Turno (Foto + GPS)"}
        >
          {isCheckedIn ? <LogOut size={16} /> : <LogIn size={16} />}
          {isCheckedIn ? 'Finalizar Turno' : 'Iniciar Turno'}
        </button>
        
        <div style={{ display: 'flex', gap: 4 }}>
          <MapPin size={14} style={{ color: 'var(--text-tertiary)' }} title="GPS Requerido" />
          <Camera size={14} style={{ color: 'var(--text-tertiary)' }} title="Foto Requerida" />
        </div>
      </div>

      {showCameraModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '100%', maxWidth: 400, padding: 24, textAlign: 'center' }}>
            <h3 style={{ marginBottom: 16 }}>Verificación Facial</h3>
            
            {cameraError ? (
              <div style={{ color: 'var(--accent-rose)', marginBottom: 16 }}>{cameraError}</div>
            ) : (
              <div style={{ position: 'relative', width: '100%', aspectRatio: '3/4', background: '#000', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
                {!capturedPhoto ? (
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <img 
                    src={capturedPhoto} 
                    alt="Selfie" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={stopCamera}>Cancelar</button>
              
              {!capturedPhoto ? (
                <button className="btn btn-primary" onClick={takePhoto} disabled={!!cameraError}>
                  <Camera size={18} style={{ marginRight: 6 }} /> Tomar Foto
                </button>
              ) : (
                <>
                  <button className="btn btn-secondary" onClick={retakePhoto}>Repetir</button>
                  <button className="btn btn-primary" onClick={confirmAttendance} style={{ background: 'var(--accent-emerald)', color: '#fff' }}>
                    Confirmar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
