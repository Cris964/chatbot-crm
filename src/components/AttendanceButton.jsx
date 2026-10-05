import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useTenant } from '../lib/useTenant'
import { LogIn, LogOut, Loader2, MapPin, Camera, ScanFace } from 'lucide-react'
import * as faceapi from 'face-api.js'

export default function AttendanceButton({ session }) {
  const tenant = useTenant()
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isModelsLoaded, setIsModelsLoaded] = useState(false)
  const [showCameraModal, setShowCameraModal] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [capturedPhoto, setCapturedPhoto] = useState(null)
  
  // Biometric state
  const [enrolledDescriptor, setEnrolledDescriptor] = useState(null)
  const [isEnrollmentMode, setIsEnrollmentMode] = useState(false)
  const [matchStatus, setMatchStatus] = useState(null) // 'success' | 'failed' | null

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => {
    if (!session?.user?.id || !tenant?.clientId) return
    loadModels()
    checkCurrentStatus()
  }, [session, tenant])

  const loadModels = async () => {
    try {
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models')
      ])
      setIsModelsLoaded(true)
    } catch (err) {
      console.error("Error cargando modelos de IA:", err)
    }
  }

  const checkCurrentStatus = async () => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // 1. Check if user has an enrollment descriptor
      const { data: enrollmentData } = await supabase
        .from('attendance_logs')
        .select('device_info')
        .eq('user_id', session.user.id)
        .eq('type', 'enrollment')
        .limit(1)

      if (enrollmentData && enrollmentData.length > 0 && enrollmentData[0].device_info) {
        try {
            const arr = JSON.parse(enrollmentData[0].device_info)
            setEnrolledDescriptor(new Float32Array(arr))
            setIsEnrollmentMode(false)
        } catch(e) { console.error('Error parsing descriptor') }
      } else {
        setIsEnrollmentMode(true) // Needs to enroll their face first
      }

      // 2. Check today's check-in status
      const { data, error } = await supabase
        .from('attendance_logs')
        .select('type')
        .eq('user_id', session.user.id)
        .eq('client_id', tenant.clientId)
        .gte('timestamp', today.toISOString())
        .neq('type', 'enrollment') // exclude enrollment records
        .order('timestamp', { ascending: false })
        .limit(1)

      if (data && data.length > 0) {
        setIsCheckedIn(data[0].type === 'check_in')
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
    if (!isModelsLoaded) {
        alert("Los modelos de IA aún están cargando. Espera un momento y vuelve a intentar.")
        return
    }
    setCameraError('')
    setCapturedPhoto(null)
    setMatchStatus(null)
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

  const takeAndAnalyzePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      if (videoRef.current.videoWidth === 0) {
          setCameraError("La cámara aún se está inicializando. Intenta de nuevo.");
          return;
      }
      setIsLoading(true);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedPhoto(photoDataUrl);

      setTimeout(async () => {
      try {
        const detection = await faceapi.detectSingleFace(canvas).withFaceLandmarks().withFaceDescriptor();
        
        if (!detection) {
            setMatchStatus('failed');
            setCameraError("No se detectó ningún rostro. Asegúrate de estar bien iluminado y mirar a la cámara.");
            setIsLoading(false);
            return;
        }

        const descriptor = detection.descriptor;
        const dims = faceapi.matchDimensions(canvas, video, true);
        const resizedDetection = faceapi.resizeResults(detection, dims);
        const box = resizedDetection.detection.box;

        if (isEnrollmentMode) {
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#6366f1';
            ctx.strokeRect(box.x, box.y, box.width, box.height);
            
            ctx.fillStyle = '#6366f1';
            ctx.fillRect(box.x, box.y - 30, box.width, 30);
            ctx.fillStyle = '#ffffff';
            ctx.font = '16px Arial';
            ctx.fillText(`${session.user.email.split('@')[0]} (Registrando)`, box.x + 5, box.y - 10);
            
            const finalPhotoUrl = canvas.toDataURL('image/jpeg', 0.8);
            setCapturedPhoto(finalPhotoUrl);

            const descriptorArray = Array.from(descriptor);
            const { error: enrollError } = await supabase.from('attendance_logs').insert([{
                client_id: tenant.clientId,
                user_id: session.user.id,
                user_email: session.user.email,
                type: 'enrollment',
                biometric_verified: true,
                device_info: JSON.stringify(descriptorArray)
            }]);
            if (enrollError) throw enrollError;
            
            setEnrolledDescriptor(new Float32Array(descriptorArray));
            setIsEnrollmentMode(false);
            alert("¡Rostro registrado exitosamente! Ahora tu cara es tu llave de acceso.");
            
            await confirmAttendance(finalPhotoUrl);
        } else {
            const distance = faceapi.euclideanDistance(descriptor, enrolledDescriptor);
            const percentage = Math.max(0, Math.round((1 - distance) * 100));
            const isMatch = distance < 0.6;
            
            ctx.lineWidth = 4;
            ctx.strokeStyle = isMatch ? '#10b981' : '#ef4444';
            ctx.strokeRect(box.x, box.y, box.width, box.height);
            
            ctx.fillStyle = isMatch ? '#10b981' : '#ef4444';
            ctx.fillRect(box.x, box.y - 30, box.width, 30);
            ctx.fillStyle = '#ffffff';
            ctx.font = '16px Arial';
            ctx.fillText(isMatch ? `${session.user.email.split('@')[0]} ${percentage}%` : `Desconocido ${percentage}%`, box.x + 5, box.y - 10);
            
            const finalPhotoUrl = canvas.toDataURL('image/jpeg', 0.8);
            setCapturedPhoto(finalPhotoUrl);

            if (isMatch) {
                setMatchStatus('success');
                await confirmAttendance(finalPhotoUrl);
            } else {
                setMatchStatus('failed');
                setCameraError("Rostro no reconocido. La persona en la cámara no coincide con el perfil registrado.");
                setIsLoading(false);
            }
        }
      } catch (aiErr) {
          console.error(aiErr);
          setCameraError("Error al procesar el reconocimiento facial.");
          setIsLoading(false);
      }
      }, 100);
    }
  }

  const retakePhoto = () => {
    setCapturedPhoto(null)
    setMatchStatus(null)
    setCameraError('')
  }

  const confirmAttendance = async (photoDataUrl) => {
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
            const base64Data = photoDataUrl.replace(/^data:image\/\w+;base64,/, '')
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
            // We proceed even if photo upload fails to not block their check-in, but log it
            photoUrl = "error_uploading_photo"
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
            biometric_verified: true, 
            device_info: photoUrl // Storing photoUrl here
        }])

        if (error) {
            alert("Error guardando asistencia: " + error.message)
            stopCamera()
            setIsLoading(false)
            return
        }

        setIsCheckedIn(!isCheckedIn)
        stopCamera()
        setIsLoading(false)
        
        alert(`Turno ${actionType === 'check_in' ? 'Iniciado' : 'Finalizado'} exitosamente. \\nAutenticación facial correcta.`)

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

  if (isLoading && !showCameraModal) {
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
          title={isCheckedIn ? "Finalizar Turno" : "Iniciar Turno (Reconocimiento Facial)"}
        >
          {isCheckedIn ? <LogOut size={16} /> : <LogIn size={16} />}
          {isCheckedIn ? 'Finalizar Turno' : 'Iniciar Turno'}
        </button>
        
        <div style={{ display: 'flex', gap: 4 }}>
          <MapPin size={14} style={{ color: 'var(--text-tertiary)' }} title="GPS Requerido" />
          <ScanFace size={14} style={{ color: 'var(--text-tertiary)', opacity: isModelsLoaded ? 1 : 0.4 }} title={isModelsLoaded ? "IA Facial Lista" : "Cargando IA..."} />
        </div>
      </div>

      {showCameraModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="card" style={{ width: '100%', maxWidth: 400, padding: 24, textAlign: 'center', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: 8 }}>
                {isEnrollmentMode ? 'Registro Facial Inicial' : 'Verificación Facial'}
            </h3>
            {isEnrollmentMode && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 16 }}>Es tu primera vez. Mira a la cámara para guardar tu perfil biométrico.</p>}
            
            {cameraError && (
              <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-rose)', borderRadius: 8, marginBottom: 16, fontSize: '0.85rem' }}>
                {cameraError}
              </div>
            )}

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
              
              {/* Overlay for Face Frame */}
              {!capturedPhoto && (
                  <div style={{ position: 'absolute', inset: 20, border: '2px dashed rgba(255,255,255,0.4)', borderRadius: '50%', pointerEvents: 'none' }}></div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={stopCamera} disabled={isLoading && capturedPhoto}>Cancelar</button>
              
              {!capturedPhoto ? (
                <button className="btn btn-primary" onClick={takeAndAnalyzePhoto} disabled={!!cameraError || (isLoading && !showCameraModal)}>
                  <ScanFace size={18} style={{ marginRight: 6 }} /> Analizar Rostro
                </button>
              ) : (
                <>
                  {matchStatus === 'failed' && (
                    <button className="btn btn-secondary" onClick={retakePhoto}>Intentar de nuevo</button>
                  )}
                  {isLoading && matchStatus !== 'failed' && (
                     <button className="btn btn-primary disabled" disabled><Loader2 size={16} className="animate-spin" /> Procesando...</button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
