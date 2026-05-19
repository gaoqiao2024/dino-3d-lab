import React, { useState, Suspense, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment, Html, useProgress } from '@react-three/drei'
import * as THREE from 'three'
import { motion, AnimatePresence } from 'framer-motion'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'

// --- 💖 琥珀金配色 ---
const THEME = {
  bgGradient: 'radial-gradient(circle, #353535 0%, #121212 100%)',
  accent: '#E67E22',
  textLight: '#F2F2F7',
}

// --- 🦖 恐龙数据库 ---
const DINO_LIST = [
  {
    id: "trex", name: "霸王龙", enName: "T-Rex", thumb: "/thumb.webp",
    models: { skin: "/skin.glb", muscle: "/muscle.glb", bone: "/bone.glb" },
    layers: {
      skin: { title: "🦖 霸王龙皮肤秘密", enTitle: "SKIN SECRETS", image: "/skin_info.webp", desc: "颈部可能长着酷酷的原始羽毛！✨", tags: ["#皮肤", "#羽毛"], details: [{ icon: "🛡️", label: "防御 Defense", text: "坚硬角质" }] },
      muscle: { title: "💪 最强咬合力解析", enTitle: "POWER BITE", image: "/muscle_info.webp", desc: "咬合力足以瞬间压碎一辆轿车 🚗。", tags: ["#碎骨机", "#肌肉"], details: [{ icon: "🦷", label: "咬肌 Bite", text: "6吨恐怖咬合" }] },
      bone: { title: "🦴 中空骨骼黑科技", enTitle: "SKELETAL TECH", image: "/bone_info.webp", desc: "它的骨头是“中空气腔”结构！🕊️", tags: ["#中空骨骼", "#轻量化"], details: [{ icon: "🏗️", label: "结构 Structure", text: "蜂窝状轻量化" }] }
    }
  },
  {
    id: "triceratops", name: "三角龙", enName: "Triceratops", thumb: "/tri_thumb.webp",
    models: { skin: "/tri_skin.glb", muscle: "/tri_muscle.glb", bone: "/tri_bone.glb" },
    layers: {
      skin: { title: "🛡️ 角龙类防御工事", enTitle: "DEFENSIVE SHIELD", image: "/tri_skin_info.webp", desc: "巨大的颈盾和三只尖角是它的标志。", tags: ["#坦克级防御"], details: [{ icon: "🛡️", label: "颈盾 Shield", text: "实心骨质" }] },
      muscle: { title: "💪 结实的四肢肌群", enTitle: "QUADRUPEDAL POWER", image: "/tri_muscle_info.webp", desc: "食草界的“重装坦克”，前肢极强。🏃", tags: ["#核心肌群"], details: [{ icon: "🦵", label: "负重力 Support", text: "支撑 10 吨体重" }] },
      bone: { title: "🦴 坚实的实心骨骼", enTitle: "SOLID BONE", image: "/tri_bone_info.webp", desc: "骨骼厚重、密实，为对抗肉食龙提供稳固底盘。", tags: ["#实心骨骼"], details: [{ icon: "📐", label: "头骨比例 Skull", text: "头骨占体长 1/3" }] }
    }
  }
]

function Loader() {
  const { progress } = useProgress()
  return <Html center><div style={{ color: '#fff', fontSize: '10px', background: 'rgba(0,0,0,0.5)', padding: '10px 20px', borderRadius: '20px' }}>穿越中... {Math.round(progress)}%</div></Html>
}

function DinoModel({ val, isMobile, modelPaths }) {
  const dracoConf = (loader) => {
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.5/')
    loader.setDRACOLoader(dracoLoader)
  }

  const skinGLTF = useGLTF(modelPaths.skin, dracoConf)
  const muscleGLTF = useGLTF(modelPaths.muscle, dracoConf)
  const boneGLTF = useGLTF(modelPaths.bone, dracoConf)
  const smoothVal = useRef(0)

  useFrame(() => {
    smoothVal.current = THREE.MathUtils.lerp(smoothVal.current, val, 0.1)
    const v = smoothVal.current
    const op = [Math.max(0, 1 - v / 100), v <= 100 ? v / 100 : Math.max(0, 1 - (v - 100) / 100), Math.max(0, (v - 100) / 100)]
    const scenes = [skinGLTF.scene, muscleGLTF.scene, boneGLTF.scene]
    scenes.forEach((s, i) => {
      s.traverse(c => {
        if (c.isMesh) {
          c.material.transparent = true; c.material.opacity = op[i]; c.visible = op[i] > 0.01;
        }
      })
    })
  })

  return (
    <group scale={isMobile ? 5 : 7.5} position={[0, isMobile ? -0.5 : -1.2, 0]}>
      <primitive object={skinGLTF.scene} />
      <primitive object={muscleGLTF.scene} />
      <primitive object={boneGLTF.scene} />
    </group>
  )
}

function ImageViewer({ src, onClose }) {
  const [scale, setScale] = useState(1)
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
      style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 10000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', background: THEME.accent, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '30px', fontWeight: 'bold' }}>关闭 ✕</button>
      <motion.div drag dragConstraints={{ left: -300, right: 300, top: -300, bottom: 300 }}>
        <motion.img animate={{ scale }} src={src} style={{ maxWidth: '95vw', maxHeight: '70vh', borderRadius: '10px' }} />
      </motion.div>
      <div style={{ position: 'absolute', bottom: '40px', width: '80%', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <input type="range" min="0.5" max="3" step="0.1" value={scale} onChange={(e) => setScale(parseFloat(e.target.value))} style={{ flex: 1, accentColor: THEME.accent }} />
      </div>
    </motion.div>
  )
}

export default function App() {
  const [val, setVal] = useState(0)
  const [activeDinoIdx, setActiveDinoIdx] = useState(0)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)
  const [viewerOpen, setViewerOpen] = useState(false)

  const activeDino = DINO_LIST[activeDinoIdx]
  const current = val < 60 ? activeDino.layers.skin : val < 140 ? activeDino.layers.muscle : activeDino.layers.bone

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', width: '100vw', height: '100vh', background: THEME.bgGradient, color: '#fff', overflow: isMobile ? 'auto' : 'hidden' }}>
      <AnimatePresence>{viewerOpen && <ImageViewer src={current.image} onClose={() => setViewerOpen(false)} />}</AnimatePresence>

      {/* 顶部标题栏 */}
      <div style={{ position: 'fixed', top: 0, width: '100%', height: '50px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', padding: '0 20px', zIndex: 500, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ fontSize: '12px', fontWeight: 900, color: THEME.accent }}>恐龙实验室 <span style={{ color: '#666', fontWeight: 300 }}>| DINOSCIENCE LAB</span></div>
      </div>

      {/* 1. 左侧栏 (电脑) / 顶部横滑栏 (手机) */}
      <div style={{ 
        width: isMobile ? '100%' : '180px', 
        padding: isMobile ? '60px 15px 10px' : '90px 15px', 
        background: 'rgba(0,0,0,0.3)', borderRight: isMobile ? 'none' : '1px solid rgba(255,255,255,0.05)', flexShrink: 0 
      }}>
        <div style={{ fontSize: '10px', color: THEME.accent, fontWeight: 'bold', marginBottom: '10px' }}>物种库 SPECIES</div>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: '10px', overflowX: isMobile ? 'auto' : 'visible', paddingBottom: '10px' }}>
          {DINO_LIST.map((dino, idx) => (
            <div key={dino.id} onClick={() => {setActiveDinoIdx(idx); setVal(0)}} style={{ 
              flexShrink: 0, display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '12px', cursor: 'pointer',
              background: activeDinoIdx === idx ? 'rgba(230, 126, 34, 0.2)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${activeDinoIdx === idx ? THEME.accent : 'transparent'}`
            }}>
              <img src={dino.thumb} style={{ width: '30px', height: '30px', borderRadius: '6px' }} />
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: activeDinoIdx === idx ? '#fff' : '#666', whiteSpace: 'nowrap' }}>{dino.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. 中间 3D 画布 */}
      <div style={{ flex: 1, position: 'relative', height: isMobile ? '60vh' : 'auto', minHeight: '400px' }}>
        <Canvas dpr={isMobile ? 1 : [1, 2]} camera={{ position: [0, 1, 8], fov: 28 }}>
          <ambientLight intensity={2.5} /><pointLight position={[10, 10, 10]} intensity={1.5} color={THEME.accent} />
          <Suspense fallback={<Loader />}>
            <DinoModel key={activeDino.id} val={val} isMobile={isMobile} modelPaths={activeDino.models} />
            {!isMobile && <Environment preset="city" />}
          </Suspense>
          <OrbitControls makeDefault enableDamping />
        </Canvas>
        <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', width: '85%', zIndex: 100 }}>
          <input type="range" min="0" max="200" value={val} onChange={(e) => setVal(parseInt(e.target.value))} style={{ width: '100%', accentColor: THEME.accent }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '9px', fontWeight: 'bold', color: 'rgba(255,255,255,0.3)' }}>
            <span style={{ color: val < 60 ? THEME.accent : '' }}>皮肤 SKIN</span>
            <span style={{ color: val >= 60 && val < 140 ? THEME.accent : '' }}>肌肉 MUSCLE</span>
            <span style={{ color: val >= 140 ? THEME.accent : '' }}>骨骼 BONE</span>
          </div>
        </div>
      </div>

      {/* 3. 右侧百科 (手机在下) */}
      <div style={{ width: isMobile ? '100%' : '360px', background: '#fff', color: '#1d1d1f', borderTopLeftRadius: isMobile ? '30px' : '40px' }}>
        <div style={{ padding: '30px' }}>
          <div onClick={() => setViewerOpen(true)} style={{ position: 'relative', borderRadius: '20px', overflow: 'hidden', cursor: 'zoom-in', boxShadow: '0 15px 35px rgba(0,0,0,0.1)' }}>
            <img key={current.image} src={current.image} style={{ width: '100%', display: 'block' }} />
            <div style={{ position: 'absolute', bottom: '15px', right: '15px', background: THEME.accent, color: '#fff', padding: '6px 12px', borderRadius: '15px', fontSize: '10px', fontWeight: 'bold' }}>放大查看 🔍</div>
          </div>
          <div style={{ marginTop: '25px' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 900 }}>{current.title}</h2>
            <div style={{ fontSize: '12px', color: '#999', fontWeight: 'bold', marginBottom: '15px' }}>{current.enTitle}</div>
            <p style={{ fontSize: '14px', color: '#424245', lineHeight: '1.7' }}>{current.desc}</p>
            <div style={{ display: 'grid', gap: '12px', marginTop: '20px' }}>
              {current.details.map(item => (
                <div key={item.label} style={{ background: '#f5f5f7', padding: '15px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ fontSize: '24px' }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '900', color: THEME.accent }}>{item.label}</div>
                    <div style={{ fontSize: '11px', color: '#86868b' }}>{item.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}