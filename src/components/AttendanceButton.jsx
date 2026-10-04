import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useTenant } from '../lib/useTenant'
import { LogIn, LogOut, Loader2, MapPin, Fingerprint } from 'lucide-react'

export default function AttendanceButton({ session }) {
  const tenant = useTenant()
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [lastAction, setLastAction] = useState(null)

  useEffect(() => {
    if (!session?.user?.id || !tenant?.clientId) return
    checkCurrentStatus()
  }, [session, tenant])

  const checkCurrentStatus = async () => {
    try {
      // Find the most recent attendance log for today
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

      if (error && error.code !== '42P01') {
          console.error("Attendance fetch error:", error)
      }

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

  const handleToggleAttendance = async () => {
    const actionType = isCheckedIn ? 'check_out' : 'check_in'
    
    // 1. Biometric Check (WebAuthn local verification trick)
    let biometricVerified = false;
    try {
        if (window.PublicKeyCredential) {
            // We generate a dummy challenge just to prompt the local device authenticator (FaceID/TouchID/Windows Hello)
            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);
            
            const credential = await navigator.credentials.create({
                publicKey: {
                    challenge: challenge,
                    rp: { name: "Nexus CRM", id: window.location.hostname },
                    user: {
                        id: new Uint8Array(16),
                        name: session.user.email,
                        displayName: session.user.email
                    },
                    pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
                    authenticatorSelection: {
                        authenticatorAttachment: "platform", // Force local device (FaceID/TouchID)
                        userVerification: "required"
                    },
                    timeout: 60000
                }
            });
            if (credential) biometricVerified = true;
        } else {
            console.warn("Biometría no soportada en este navegador");
        }
    } catch (e) {
        console.error("Biometric error or cancelled:", e);
        alert("Autenticación biométrica fallida o cancelada. Requerido para registrar asistencia.");
        return;
    }

    // 2. Geolocation
    setIsLoading(true);
    if (!navigator.geolocation) {
        alert("Geolocalización no soportada en tu navegador.");
        setIsLoading(false);
        return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        const device_info = navigator.userAgent;

        // 3. Save to DB
        const { error } = await supabase.from('attendance_logs').insert([{
            client_id: tenant.clientId,
            user_id: session.user.id,
            user_email: session.user.email,
            type: actionType,
            latitude,
            longitude,
            biometric_verified: biometricVerified,
            device_info
        }]);

        if (error) {
            if (error.code === '42P01') {
                alert("Error: La tabla attendance_logs no existe. Pide al administrador que ejecute el SQL.");
            } else {
                alert("Error guardando asistencia: " + error.message);
            }
            setIsLoading(false);
            return;
        }

        setIsCheckedIn(!isCheckedIn);
        setLastAction(new Date().toISOString());
        setIsLoading(false);
        
        alert(`Turno ${actionType === 'check_in' ? 'Iniciado' : 'Finalizado'} exitosamente. \\nUbicación guardada.`);

    }, (geoErr) => {
        alert("No se pudo obtener la ubicación. Permite el acceso al GPS para registrar asistencia.");
        setIsLoading(false);
    }, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    });
  }

  if (isLoading) {
    return (
      <button className="header-action-btn disabled">
        <Loader2 size={18} className="animate-spin" />
      </button>
    )
  }

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
      <button 
        className="btn btn-sm" 
        onClick={handleToggleAttendance}
        style={{ 
            background: isCheckedIn ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
            color: isCheckedIn ? 'var(--accent-rose)' : 'var(--accent-emerald)',
            border: `1px solid ${isCheckedIn ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6
        }}
        title={isCheckedIn ? "Finalizar Turno" : "Iniciar Turno (GPS + Biometría)"}
      >
        {isCheckedIn ? <LogOut size={16} /> : <LogIn size={16} />}
        {isCheckedIn ? 'Finalizar Turno' : 'Iniciar Turno'}
      </button>
      
      {/* Indicadores visuales */}
      <div style={{ display: 'flex', gap: 4 }}>
        <MapPin size={14} style={{ color: 'var(--text-tertiary)' }} title="GPS Requerido" />
        <Fingerprint size={14} style={{ color: 'var(--text-tertiary)' }} title="Biometría Requerida" />
      </div>
    </div>
  )
}
