import React, { useState, Suspense, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment, Html, useProgress } from '@react-three/drei'
import * as THREE from 'three'
import { motion, AnimatePresence } from 'framer-motion'

// --- 💖 双语版趣味科普数据库 ---
const DINO_DATA = {
  skin: {
    title: "🦖 霸王龙皮肤秘密", enTitle: "SKIN TEXTURE SECRETS",
    image: "/skin_info.webp", 
    desc: "最新的研究发现，霸王龙并非全身只有冷冰冰的鳞片，它们颈部可能长着酷酷的原始羽毛！✨",
    tags: ["#皮肤管理", "#原始羽毛"],
    details: [{ icon: "🛡️", label: "防御系统 Defense", text: "坚硬角质层" }, { icon: "🎨", label: "颜色感知 Color", text: "可能拥有斑纹" }]
  },
  muscle: {
    title: "💪 最强咬合力解析", enTitle: "POWERFUL BITE FORCE",
    image: "/muscle_info.webp",
    desc: "霸王龙拥有生物史上最恐怖的咬肌！咬合力足以瞬间压碎一辆轿车 🚗。",
    tags: ["#碎骨机", "#核心训练"],
    details: [{ icon: "🦷", label: "咬肌强度 Bite", text: "6吨恐怖咬合力" }, { icon: "🏃", label: "爆发速度 Sprint", text: "强力后肢肌肉" }]
  },
  bone: {
    title: "🦴 中空骨骼黑科技", enTitle: "SKELETAL TECHNOLOGY",
    image: "/bone_info.webp",
    desc: "它的骨头是“中空气腔”结构！🕊️ 这种设计让它既轻盈又坚固，简直是史前版大疆。",
    tags: ["#中空骨骼", "#轻量化"],
    details: [{ icon: "🏗️", label: "结构 Structure", text: "蜂窝状轻量化" }, { icon: "🫁", label: "呼吸 Respiratory", text: "气囊呼吸泵" }]
  }
}

function Loader() {
  const { progress } = useProgress()
  return (
    <Html center><div style={{ color: '#fff', fontSize: '10px', letterSpacing: '2px', background: 'rgba(0,0,0,0.5)', padding: '10px 20px', borderRadius: '20px' }}>LOADING {Math.round(progress)}%</div></Html>
  )
}

function DinoModel({ val, isMobile }) {
  const skinGLTF = useGLTF('/skin.glb')
  const muscleGLTF = useGLTF('/muscle.glb')
  const boneGLTF = useGLTF('/bone.glb')
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
          c.castShadow = false; c.receiveShadow = false;
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

// --- 🖼️ 图片全屏查看器 (增强手机端缩放) ---
function ImageViewer({ src, onClose }) {
  const [scale, setScale] = useState(1)
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
      style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 10000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', touchAction: 'none' }}>
      
      <div style={{ position: 'absolute', top: '30px', width: '100%', display: 'flex', justifyContent: 'space-between', padding: '0 30px', boxSizing: 'border-box' }}>
        <div style={{ color: '#fff', fontSize: '12px' }}>查看细节 / View Detail</div>
        <button onClick={onClose} style={{ background: '#fff', border: 'none', padding: '8px 20px', borderRadius: '20px', fontWeight: 'bold' }}>关闭 ✕</button>
      </div>

      <motion.div drag dragConstraints={{ left: -300, right: 300, top: -300, bottom: 300 }} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.img animate={{ scale }} transition={{ type: 'spring', damping: 25 }} src={src} style={{ maxWidth: '95vw', maxHeight: '80vh', borderRadius: '10px' }} />
      </motion.div>

      {/* 手机端专用缩放滑块 */}
      <div style={{ position: 'absolute', bottom: '50px', width: '80%', background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '30px', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <span style={{ color: '#fff', fontSize: '12px' }}>缩小 -</span>
        <input type="range" min="0.5" max="3" step="0.1" value={scale} onChange={(e) => setScale(parseFloat(e.target.value))} style={{ flex: 1, accentColor: '#fff' }} />
        <span style={{ color: '#fff', fontSize: '12px' }}>放大 +</span>
      </div>
    </motion.div>
  )
}

export default function App() {
  const [val, setVal] = useState(0)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)
  const [viewerOpen, setViewerOpen] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const current = val < 60 ? DINO_DATA.skin : val < 140 ? DINO_DATA.muscle : DINO_DATA.bone

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', width: '100vw', height: '100vh', background: '#000', color: '#fff', overflow: isMobile ? 'auto' : 'hidden' }}>
      <AnimatePresence>{viewerOpen && <ImageViewer src={current.image} onClose={() => setViewerOpen(false)} />}</AnimatePresence>

      {/* 顶部标识 - 手机端轻量化 */}
      <div style={{ position: 'fixed', top: 0, width: '100%', height: '50px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', padding: '0 20px', zIndex: 500, borderBottom: '1px solid rgba(255,255,255,0.1)', boxSizing: 'border-box' }}>
        <div style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '2px' }}>恐龙实验室 <span style={{ opacity: 0.3, fontWeight: 300 }}>| DINOSCIENCE LAB</span></div>
      </div>

      {/* 1. 左侧栏 (仅电脑端显示) */}
      {!isMobile && (
        <div style={{ width: '150px', padding: '90px 20px', borderRight: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '40px' }}>霸王龙</h1>
          {['皮肤', '肌肉', '骨骼'].map((label, i) => (
            <div key={label} style={{ padding: '15px 10px', borderRadius: '10px', marginBottom: '10px', fontSize: '12px', textAlign: 'center', background: val >= i*100-50 && val <= i*100+50 ? '#fff' : 'rgba(255,255,255,0.05)', color: val >= i*100-50 && val <= i*100+50 ? '#000' : '#888', fontWeight: 'bold' }}>{label}</div>
          ))}
        </div>
      )}

      {/* 2. 中间 3D 画布 (手机端占据核心面积) */}
      <div style={{ flex: 1, position: 'relative', height: isMobile ? '60vh' : 'auto', minHeight: isMobile ? '400px' : 'auto' }}>
        <Canvas dpr={isMobile ? 1 : [1, 2]} camera={{ position: [0, 1, 8], fov: 28 }}>
          <ambientLight intensity={2} /><pointLight position={[10, 10, 10]} intensity={1.5} />
          <Suspense fallback={<Loader />}><DinoModel val={val} isMobile={isMobile} /></Suspense>
          <OrbitControls makeDefault enableDamping minDistance={5} maxDistance={15} />
        </Canvas>

        {/* 悬浮滑动控制条 */}
        <div style={{ position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', width: '85%', textAlign: 'center', zIndex: 100 }}>
          <input type="range" min="0" max="200" value={val} onChange={(e) => setVal(parseInt(e.target.value))} style={{ width: '100%', cursor: 'pointer', accentColor: '#fff' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '9px', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)' }}>
            <span style={{ color: val < 60 ? '#fff' : '' }}>皮肤 SKIN</span>
            <span style={{ color: val >= 60 && val < 140 ? '#fff' : '' }}>肌肉 MUSCLE</span>
            <span style={{ color: val >= 140 ? '#fff' : '' }}>骨骼 BONE</span>
          </div>
        </div>
      </div>

      {/* 3. 右侧百科面板 (手机端在下方) */}
      <div style={{ width: isMobile ? '100%' : '350px', background: '#fff', color: '#1d1d1f', borderTopLeftRadius: isMobile ? '30px' : '40px', overflow: 'visible' }}>
        <div style={{ padding: '30px' }}>
          {/* 手机端独有的快捷切换标签 */}
          {isMobile && (
            <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
              {['皮肤', '肌肉', '骨骼'].map((l, i) => (
                <div key={l} onClick={() => setVal(i*100)} style={{ flex: 1, padding: '10px', borderRadius: '10px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', background: val >= i*100-50 && val <= i*100+50 ? '#1d1d1f' : '#f5f5f7', color: val >= i*100-50 && val <= i*100+50 ? '#fff' : '#86868b' }}>{l}</div>
              ))}
            </div>
          )}

          <div onClick={() => setViewerOpen(true)} style={{ position: 'relative', borderRadius: '20px', overflow: 'hidden', cursor: 'zoom-in', boxShadow: '0 15px 35px rgba(0,0,0,0.1)' }}>
            <img key={current.image} src={current.image} style={{ width: '100%', display: 'block' }} />
            <div style={{ position: 'absolute', bottom: '15px', right: '15px', background: 'rgba(255,255,255,0.9)', padding: '8px 15px', borderRadius: '20px', fontSize: '10px', fontWeight: 'bold' }}>🔍 点击放大 / View Detail</div>
          </div>

          <div style={{ marginTop: '30px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              {current.tags.map(tag => <span key={tag} style={{ color: '#0066cc', fontSize: '11px', fontWeight: 'bold' }}>{tag}</span>)}
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '2px' }}>{current.title}</h2>
            <div style={{ fontSize: '12px', color: '#999', fontWeight: 'bold', marginBottom: '15px' }}>{current.enTitle}</div>
            <p style={{ fontSize: '14px', color: '#424245', lineHeight: '1.7', textAlign: 'justify' }}>{current.desc}</p>

            <div style={{ display: 'grid', gap: '12px', marginTop: '25px' }}>
              {current.details.map(item => (
                <div key={item.label} style={{ background: '#f5f5f7', padding: '15px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ fontSize: '24px' }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '900' }}>{item.label}</div>
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