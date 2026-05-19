import React, { useState, Suspense, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment, Html, useProgress } from '@react-three/drei'
import * as THREE from 'three'
import { motion, AnimatePresence } from 'framer-motion'

// --- 💖 双语趣味科普数据库 ---
const DINO_DATA = {
  skin: {
    title: "🦖 霸王龙皮肤秘密",
    enTitle: "SKIN TEXTURE SECRETS",
    image: "/skin_info.webp", 
    desc: "最新的研究发现，霸王龙并非全身只有冷冰冰的鳞片，它们颈部可能长着酷酷的原始羽毛！✨",
    tags: ["#皮肤管理", "#原始羽毛"],
    details: [
      { icon: "🛡️", label: "防御系统 / Defense", text: "坚硬角质层" },
      { icon: "🎨", label: "颜色感知 / Color", text: "可能拥有斑纹" }
    ]
  },
  muscle: {
    title: "💪 最强咬合力解析",
    enTitle: "POWERFUL BITE FORCE",
    image: "/muscle_info.webp",
    desc: "霸王龙拥有生物史上最恐怖的咬肌！咬合力足以瞬间压碎一辆轿车 🚗。",
    tags: ["#碎骨机", "#核心训练"],
    details: [
      { icon: "🦷", label: "咬肌强度 / Bite", text: "6吨恐怖咬合力" },
      { icon: "🏃", label: "爆发速度 / Sprint", text: "强力后肢肌肉" }
    ]
  },
  bone: {
    title: "🦴 中空骨骼黑科技",
    enTitle: "SKELETAL TECHNOLOGY",
    image: "/bone_info.webp",
    desc: "它的骨头是“中空气腔”结构！🕊️ 这种设计让它既轻盈又坚固，简直是史前版大疆。",
    tags: ["#中空骨骼", "#轻量化"],
    details: [
      { icon: "🏗️", label: "结构 / Structure", text: "蜂窝状轻量化" },
      { icon: "🫁", label: "呼吸 / Respiratory", text: "气囊呼吸泵" }
    ]
  }
}

// --- 🚀 加载进度组件 ---
function Loader() {
  const { progress } = useProgress()
  return (
    <Html center>
      <div style={{ textAlign: 'center', width: '200px', color: '#fff' }}>
        <div style={{ width: '100%', height: '2px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: '#fff', transition: 'width 0.3s' }} />
        </div>
        <div style={{ marginTop: '10px', fontSize: '10px', letterSpacing: '2px' }}>LOADING {Math.round(progress)}%</div>
      </div>
    </Html>
  )
}

function DinoModel({ val, isMobile }) {
  // 同时请求三个资源，但在手机端我们会非常小心地处理它们
  const skinGLTF = useGLTF('/skin.glb')
  const muscleGLTF = useGLTF('/muscle.glb')
  const boneGLTF = useGLTF('/bone.glb')
  const smoothVal = useRef(0)

  useFrame(() => {
    smoothVal.current = THREE.MathUtils.lerp(smoothVal.current, val, 0.1)
    const v = smoothVal.current
    const op = [
      Math.max(0, 1 - v / 100), 
      v <= 100 ? v / 100 : Math.max(0, 1 - (v - 100) / 100), 
      Math.max(0, (v - 100) / 100)
    ]
    const scenes = [skinGLTF.scene, muscleGLTF.scene, boneGLTF.scene]
    scenes.forEach((s, i) => {
      s.traverse(c => {
        if (c.isMesh) {
          c.material.transparent = true
          c.material.opacity = op[i]
          c.visible = op[i] > 0.01 // 性能核心：不可见时不渲染
          c.castShadow = false 
          c.receiveShadow = false
        }
      })
    })
  })

  return (
    <group scale={isMobile ? 5 : 7} position={[0, isMobile ? -0.8 : -1.2, 0]}>
      <primitive object={skinGLTF.scene} />
      <primitive object={muscleGLTF.scene} />
      <primitive object={boneGLTF.scene} />
    </group>
  )
}

// --- 🖼️ 图片全屏查看器 ---
function ImageViewer({ src, onClose }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <button onClick={onClose} style={{ position: 'absolute', top: '30px', right: '30px', background: '#fff', border: 'none', padding: '10px 20px', borderRadius: '30px', fontWeight: 'bold', zIndex: 101 }}>关闭 Close ✕</button>
      <motion.div drag dragConstraints={{ left: -500, right: 500, top: -500, bottom: 500 }}>
        <img src={src} style={{ maxHeight: '85vh', maxWidth: '90vw', borderRadius: '10px' }} />
      </motion.div>
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
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', width: '100vw', height: '100vh', background: '#000', color: '#fff', overflow: 'hidden' }}>
      <AnimatePresence>{viewerOpen && <ImageViewer src={current.image} onClose={() => setViewerOpen(false)} />}</AnimatePresence>

      {/* --- 顶部标题 / Header --- */}
      <div style={{ position: 'fixed', top: 0, width: '100%', height: '50px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', padding: '0 20px', zIndex: 500, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '2px' }}>
          恐龙科学实验室 <span style={{ color: '#444' }}>| DINOSCIENCE LAB</span>
        </div>
      </div>

      {/* --- 1. 左侧导航 (极致窄版) --- */}
      <div style={{ width: isMobile ? '100%' : '140px', padding: isMobile ? '70px 15px 15px' : '90px 15px', borderRight: '1px solid rgba(255,255,255,0.1)', flexShrink: 0, zIndex: 10 }}>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 900, margin: '0 0 30px' }}>霸王龙</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {['皮肤', '肌肉', '骨骼'].map((label, i) => (
            <div key={label} style={{ 
              padding: '12px 10px', borderRadius: '8px', fontSize: '11px', textAlign: 'center', fontWeight: 'bold',
              background: val >= i*100-50 && val <= i*100+50 ? '#fff' : 'rgba(255,255,255,0.05)',
              color: val >= i*100-50 && val <= i*100+50 ? '#000' : '#555',
            }}>{label}</div>
          ))}
        </div>
      </div>

      {/* --- 2. 中间 3D 画布 --- */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Canvas 
          // 移动端极致性能优化：像素比设为1，关闭抗锯齿
          dpr={isMobile ? 1 : [1, 2]} 
          gl={{ antialias: !isMobile, alpha: false, stencil: false }}
          camera={{ position: [0, 1, 8], fov: 28 }}
        >
          <ambientLight intensity={2} />
          <pointLight position={[10, 10, 10]} intensity={1.5} />
          <Suspense fallback={<Loader />}>
            <DinoModel val={val} isMobile={isMobile} />
            {/* 移动端不加载 Environment 以防显存爆掉 */}
            {!isMobile && <Environment preset="city" />}
          </Suspense>
          <OrbitControls makeDefault enableDamping minDistance={5} maxDistance={15} />
        </Canvas>

        {/* 智能滑动条 */}
        <div style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', width: '80%', textAlign: 'center' }}>
          <input type="range" min="0" max="200" value={val} onChange={(e) => setVal(parseInt(e.target.value))} 
            style={{ width: '100%', cursor: 'pointer', accentColor: '#fff' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', color: '#444', fontSize: '9px', fontWeight: 'bold' }}>
            <span style={{ color: val < 60 ? '#fff' : '#444' }}>皮肤 SKIN</span>
            <span style={{ color: val >= 60 && val < 140 ? '#fff' : '#444' }}>肌肉 MUSCLE</span>
            <span style={{ color: val >= 140 ? '#fff' : '#444' }}>骨骼 BONE</span>
          </div>
        </div>
      </div>

      {/* --- 3. 右侧百科面板 --- */}
      <div style={{ width: isMobile ? '100%' : '320px', background: '#fff', color: '#1d1d1f', overflowY: 'auto', borderTopLeftRadius: isMobile ? '25px' : '35px' }}>
        <div style={{ padding: '25px' }}>
          {/* 缩略图引导 */}
          <div onClick={() => setViewerOpen(true)} style={{ position: 'relative', borderRadius: '15px', overflow: 'hidden', cursor: 'zoom-in', background: '#f5f5f7' }}>
            <img key={current.image} src={current.image} style={{ width: '100%', display: 'block', opacity: 0.9 }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', opacity: 0, transition: '0.3s' }} onMouseEnter={e => e.currentTarget.style.opacity=1} onMouseLeave={e => e.currentTarget.style.opacity=0}>
               <div style={{ color: '#fff', fontSize: '12px', fontWeight: 'bold', border: '1px solid #fff', padding: '8px 15px', borderRadius: '20px' }}>点击放大查看 / View Detail</div>
            </div>
            {/* 移动端常驻引导语 */}
            {isMobile && <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(255,255,255,0.9)', padding: '5px 12px', borderRadius: '15px', fontSize: '10px', fontWeight: 'bold' }}>点击放大查看 🔍</div>}
          </div>

          <div style={{ marginTop: '25px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              {current.tags.map(tag => <span key={tag} style={{ color: '#0066cc', fontSize: '11px', fontWeight: 'bold' }}>{tag}</span>)}
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '2px' }}>{current.title}</h2>
            <div style={{ fontSize: '12px', color: '#999', fontWeight: 'bold', marginBottom: '15px' }}>{current.enTitle}</div>
            <p style={{ fontSize: '13px', color: '#424245', lineHeight: '1.6' }}>{current.desc}</p>

            <div style={{ display: 'grid', gap: '10px', marginTop: '20px' }}>
              {current.details.map(item => (
                <div key={item.label} style={{ background: '#f5f5f7', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '20px' }}>{item.icon}</span>
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