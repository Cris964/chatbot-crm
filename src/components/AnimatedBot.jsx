import React, { useEffect, useState } from 'react';

export default function AnimatedBot({ emailLength, isPasswordFocused, isEmailFocused }) {
  // Calcular la posicin de las pupilas basada en la longitud del texto
  const maxMove = 15; // Mǭximo movimiento en pxeles
  // Asumimos que ~25 caracteres llegan al borde derecho
  let pupilOffset = Math.min((emailLength / 25) * maxMove, maxMove);
  if (!isEmailFocused && !isPasswordFocused) {
    pupilOffset = 0; // Regresa al centro si no estǭ escribiendo
  }

  return (
    <div className="bot-container">
      <style>{`
        .bot-container {
          position: relative;
          width: 150px;
          height: 150px;
          margin: 0 auto -20px auto;
        }
        
        .bot-head {
          width: 140px;
          height: 120px;
          background: #e2e8f0;
          border-radius: 60px 60px 40px 40px;
          position: absolute;
          bottom: 0;
          left: 5px;
          box-shadow: inset -10px -10px 20px rgba(0,0,0,0.1), 0 10px 20px rgba(0,0,0,0.1);
          border: 4px solid #cbd5e1;
          overflow: hidden;
          z-index: 2;
        }

        .bot-ears {
          position: absolute;
          width: 160px;
          height: 30px;
          top: 60px;
          left: -5px;
          z-index: 1;
        }
        .ear {
          width: 15px;
          height: 30px;
          background: #94a3b8;
          border-radius: 8px;
          position: absolute;
        }
        .ear.left { left: 0; }
        .ear.right { right: 0; }

        .bot-eyes-bg {
          background: #1e293b;
          width: 110px;
          height: 45px;
          border-radius: 25px;
          position: absolute;
          top: 30px;
          left: 11px;
          display: flex;
          justify-content: space-around;
          align-items: center;
          padding: 0 10px;
        }

        .eye {
          width: 25px;
          height: 25px;
          background: #ffffff;
          border-radius: 50%;
          position: relative;
          overflow: hidden;
          box-shadow: 0 0 10px rgba(67, 24, 255, 0.5);
        }

        .pupil {
          width: 12px;
          height: 12px;
          background: #4318FF;
          border-radius: 50%;
          position: absolute;
          top: 50%;
          left: 30%;
          transform: translateY(-50%);
          transition: left 0.1s ease-out;
        }

        .bot-mouth {
          width: 30px;
          height: 8px;
          background: #94a3b8;
          border-radius: 4px;
          position: absolute;
          bottom: 20px;
          left: 51px;
          transition: all 0.3s;
        }

        .bot-mouth.surprised {
          width: 15px;
          height: 15px;
          border-radius: 50%;
          bottom: 16px;
          left: 58px;
        }

        .bot-hands {
          position: absolute;
          width: 140px;
          height: 140px;
          bottom: -40px;
          left: 5px;
          pointer-events: none;
          z-index: 3;
        }

        .hand {
          width: 45px;
          height: 45px;
          background: #cbd5e1;
          border-radius: 50%;
          position: absolute;
          bottom: 10px;
          transition: all 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55);
          box-shadow: inset -5px -5px 10px rgba(0,0,0,0.1);
          border: 4px solid #f8fafc;
        }

        .hand.left { left: -10px; }
        .hand.right { right: -10px; }

        /* Estado: Tapando los ojos */
        .hand.covering.left {
          bottom: 85px;
          left: 20px;
        }
        .hand.covering.right {
          bottom: 85px;
          right: 20px;
        }
      `}</style>

      <div className="bot-ears">
        <div className="ear left"></div>
        <div className="ear right"></div>
      </div>
      
      <div className="bot-head">
        <div className="bot-eyes-bg">
          <div className="eye">
            <div className="pupil" style={{ left: \`calc(15% + \${pupilOffset}px)\` }}></div>
          </div>
          <div className="eye">
            <div className="pupil" style={{ left: \`calc(15% + \${pupilOffset}px)\` }}></div>
          </div>
        </div>
        <div className={\`bot-mouth \${isPasswordFocused ? 'surprised' : ''}\`}></div>
      </div>

      <div className="bot-hands">
        <div className={\`hand left \${isPasswordFocused ? 'covering' : ''}\`}></div>
        <div className={\`hand right \${isPasswordFocused ? 'covering' : ''}\`}></div>
      </div>
    </div>
  );
}
