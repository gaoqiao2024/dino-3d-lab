import React, { useState, Suspense, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment, Html, useProgress } from '@react-three/drei'
import * as THREE from 'three'
import { motion, AnimatePresence } from 'framer-motion'

// --- 💖 升级版双语趣味科普数据库 ---
const DINO_DATA = {
  skin: {
    title: "🦖 霸王龙皮肤秘密",
    enTitle: "SKIN TEXTURE SECRETS",
    image: "/skin_info.webp", 
    desc: "最新的研究发现，霸王龙并非全身只有冷冰冰的鳞片，它们颈部可能长着酷酷的原始羽毛！✨ 既是防御屏障，也是它们的“时尚外衣”。💅",
    tags: ["#皮肤管理", "#原始羽毛", "#史前时尚"],
    details: [
      { icon: "🛡️", label: "防御系统 / Defense", text: "坚硬的角质层，防御力MAX" },
      { icon: "🎨", label: "颜色感知 / Color", text: "可能拥有复杂的伪装色纹路" }
    ]
  },
  muscle: {
    title: "💪 最强咬合力解析",
    enTitle: "POWERFUL BITE FORCE",
    image: "/muscle_info.webp",
    desc: "霸王龙拥有生物史上最恐怖的咬肌！咬合力足以瞬间压碎一辆轿车 🚗。看这厚实的腿部肌肉，简直是恐龙界的“健身达人”！",
    tags: ["#力量美学", "#碎骨机", "#核心训练"],
    details: [
      { icon: "🦷", label: "咬肌强度 / Bite", text: "咬合力高达 12,800 磅" },
      { icon: "🏃", label: "爆发速度 / Sprint", text: "后肢肌肉提供极强弹射力" }
    ]
  },
  bone: {
    title: "🦴 中空骨骼黑科技",
    enTitle: "SKELETAL TECHNOLOGY",
    image: "/bone_info.webp",
    desc: "虽然个头大，但它的骨头是“中空气腔”结构！🕊️ 这种设计让它既轻盈又坚固，不仅能保持敏捷，呼吸效率还极高，简直是“涡轮增压”版心脏！",
    tags: ["#中空骨骼", "#气囊系统", "#轻量化"],
    details: [
      { icon: "🏗️", label: "骨骼架构 / Structure", text: "高强度蜂窝状中空结构" },
      { icon: "🫁", label: "呼吸泵 / Respiratory", text: "独特的单向气囊呼吸方式" }
    ]
  }
}

// --- 🚀 加载动画 ---
function Loader() {
  const { progress } = useProgress()
  return (
    <Html center>
      <div style={{ textAlign: 'center', width: '250px' }}>
        <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.2)', borderRadius: '10px' }}>
          <motion.div animate={{ width: `${progress}%` }} style={{ height: '100%', background: '#fff' }} />
        </div>
        <div style={{ marginTop: '15px', color: '#fff', fontSize: '12px', letterSpacing: '2px' }}>🦕 正在穿越白垩纪... {Math.round(progress)}%</div>
      </div>
    </Html>
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
          c.visible = op[i] > 0.01 
        }
      })
    })
  })

  return (
    <group scale={isMobile ? 5.5 : 7.2} position={[0, isMobile ? -0.8 : -1.2, 0]}>
      <primitive object={skinGLTF.scene} />
      <primitive object={muscleGLTF.scene} />
      <primitive object={boneGLTF.scene} />
    </group>
  )
}

// --- 🖼️ 高清图片全屏查看器 ---
function ImageViewer({ src, onClose }) {
  const [scale, setScale] = useState(1)
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <button onClick={onClose} style={{ position: 'absolute', top: '30px', right: '30px', background: '#fff', border: 'none', padding: '10px 20px', borderRadius: '30px', fontWeight: 'bold' }}>关闭 Close ✕</button>
      <motion.div drag onWheel={(e) => setScale(s => Math.max(0.5, Math.min(4, s - e.deltaY * 0.001)))}>
        <motion.img animate={{ scale }} src={src} style={{ maxHeight: '85vh', maxWidth: '90vw', borderRadius: '10px', cursor: 'grab' }} />
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

      {/* --- 顶部标题栏 / Top Header --- */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '60px', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(15px)', display: 'flex', alignItems: 'center', padding: '0 30px', zIndex: 500, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ fontWeight: 900, fontSize: '14px', letterSpacing: '2px' }}>
          恐龙科学实验室 <span style={{ color: '#666', fontWeight: 300 }}>| DINOSCIENCE LAB</span>
        </div>
      </div>

      {/* --- 1. 左侧导航 (窄版) / Left Sidebar --- */}
      <div style={{ width: isMobile ? '100%' : '18%', padding: isMobile ? '80px 20px 20px' : '100px 30px', borderRight: '1px solid rgba(255,255,255,0.1)', flexShrink: 0, zIndex: 10 }}>
        <div style={{ marginBottom: '40px' }}>
          <div style={{ color: '#ffcc00', fontSize: '10px', fontWeight: 'bold', marginBottom: '5px' }}>白垩纪科研中心 / CREATACEOUS LAB</div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 900, margin: 0 }}>霸王龙</h1>
          <div style={{ color: '#666', fontSize: '12px' }}>Tyrannosaurus Rex (T-Rex)</div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {['表层皮肤 / SKIN', '肌肉结构 / MUSCLE', '核心骨骼 / BONE'].map((label, i) => (
            <div key={label} style={{ 
              padding: '18px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold', transition: '0.4s',
              background: val >= i*100-50 && val <= i*100+50 ? '#fff' : 'rgba(255,255,255,0.05)',
              color: val >= i*100-50 && val <= i*100+50 ? '#000' : '#888',
              boxShadow: val >= i*100-50 && val <= i*100+50 ? '0 10px 20px rgba(255,255,255,0.2)' : 'none'
            }}>{label}</div>
          ))}
        </div>
      </div>

      {/* --- 2. 中间：超大3D区域 / Center 3D Area --- */}
      <div style={{ flex: 1.5, position: 'relative', height: isMobile ? '50vh' : 'auto' }}>
        <Canvas dpr={isMobile ? 1 : [1, 2]} camera={{ position: [0, 1, 8], fov: 28 }}>
          <ambientLight intensity={1.5} />
          <pointLight position={[10, 10, 10]} intensity={2} />
          <Suspense fallback={<Loader />}>
            <DinoModel val={val} isMobile={isMobile} />
            <Environment preset="city" />
          </Suspense>
          <OrbitControls makeDefault enableDamping minDistance={5} maxDistance={15} />
        </Canvas>

        {/* 智能阶段滑动条 / Stage Slider */}
        <div style={{ position: 'absolute', bottom: '50px', left: '50%', transform: 'translateX(-50%)', width: '70%', textAlign: 'center' }}>
          <div style={{ position: 'relative', width: '100%', marginBottom: '15px' }}>
            <input type="range" min="0" max="200" value={val} onChange={(e) => setVal(parseInt(e.target.value))} 
              style={{ width: '100%', height: '4px', cursor: 'pointer', accentColor: '#fff' }} />
            {/* 刻度标识 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', color: '#666', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px' }}>
              <div style={{ color: val < 60 ? '#fff' : '#666' }}>• 表层皮肤 SKIN</div>
              <div style={{ color: val >= 60 && val < 140 ? '#fff' : '#666' }}>• 肌肉结构 MUSCLE</div>
              <div style={{ color: val >= 140 ? '#fff' : '#666' }}>• 核心骨骼 BONE</div>
            </div>
          </div>
          <div style={{ fontSize: '9px', color: '#444', letterSpacing: '3px' }}>滑动探索深层结构 / SLIDE TO EXPLORE DEEP STRUCTURE</div>
        </div>
      </div>

      {/* --- 3. 右侧：百科面板 / Right Info Panel --- */}
      <div style={{ width: isMobile ? '100%' : '26%', background: '#fff', color: '#1d1d1f', overflowY: 'auto', borderTopLeftRadius: isMobile ? '30px' : '40px', borderBottomLeftRadius: isMobile ? '0' : '40px' }}>
        <div style={{ padding: '35px' }}>
          {/* 高清图容器 */}
          <div onClick={() => setViewerOpen(true)} style={{ position: 'relative', borderRadius: '20px', overflow: 'hidden', cursor: 'zoom-in', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <img key={current.image} src={current.image} style={{ width: '100%', display: 'block' }} />
            <div style={{ position: 'absolute', bottom: '15px', right: '15px', background: 'rgba(255,255,255,0.9)', padding: '8px 15px', borderRadius: '20px', fontSize: '10px', fontWeight: 'bold' }}>🔍 点击放大 / View Detail</div>
          </div>

          <div style={{ marginTop: '30px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
              {current.tags.map(tag => (
                <span key={tag} style={{ color: '#0066cc', fontSize: '12px', fontWeight: 'bold' }}>{tag}</span>
              ))}
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '2px' }}>{current.title}</h2>
            <div style={{ fontSize: '14px', color: '#999', fontWeight: 'bold', marginBottom: '20px' }}>{current.enTitle}</div>
            <p style={{ fontSize: '14px', color: '#424245', lineHeight: '1.8', margin: '20px 0', textAlign: 'justify' }}>{current.desc}</p>

            {/* 趣味数据卡片组 */}
            <div style={{ display: 'grid', gap: '15px', marginTop: '30px' }}>
              {current.details.map(item => (
                <div key={item.label} style={{ background: '#f5f5f7', padding: '18px', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid #eee' }}>
                  <span style={{ fontSize: '28px' }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '900', color: '#1d1d1f' }}>{item.label}</div>
                    <div style={{ fontSize: '12px', color: '#86868b', marginTop: '2px' }}>{item.text}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{ marginTop: '50px', padding: '30px 0', borderTop: '1px solid #eee', textAlign: 'center', color: '#ddd', fontSize: '11px', letterSpacing: '1px' }}>
              DINOSCIENCE ARCHIVE © 2024<br/>数据来源：白垩纪化石研究数据库
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}