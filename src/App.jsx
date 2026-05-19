import React, { useState, Suspense, useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment, ContactShadows, Html } from '@react-three/drei'
import * as THREE from 'three'
import { motion, AnimatePresence } from 'framer-motion'

// --- 深度科研数据库 ---
const DINO_DATA = {
  skin: {
    title: "皮肤纹理与原始羽毛细节",
    en: "SKIN TEXTURE & PROTO-FEATHERS",
    image: "/skin_info.jpg", 
    desc: "霸王龙的外部包络不仅是防御屏障，更是复杂的生物感官系统。通过高倍率显微研究，我们还原了其从鳞片到原始羽毛的演化细节。",
    features: ["皮肤剖面结构图", "鳞片纹理放大图", "原始羽毛细节", "角质外层特写", "鳞片类型对比"],
    stats: [{ label: "主要成分", value: "角质化鳞片" }, { label: "羽毛分布", value: "颈/手臂/尾部" }]
  },
  muscle: {
    title: "肌肉结构与咬合力分析",
    en: "MUSCLE & BITE FORCE ANALYSIS",
    image: "/muscle_info.jpg",
    desc: "霸王龙的肌肉系统是史前生物力学的巅峰。其巨大的咬肌和稳固的后肢肌群，使其具备了摧毁任何生物防御的恐怖力量。",
    features: ["全身肌肉解剖图", "咬合力热力分布", "最大咬合力 12,800 lbf", "肌肉纤维方向示意", "肌肉显微结构"],
    stats: [{ label: "爆发推力", value: "约 8.0 吨" }, { label: "咬合压力", value: "极高" }]
  },
  bone: {
    title: "骨骼结构与中空骨骼解析",
    en: "SKELETAL & PNEUMATIC SYSTEM",
    image: "/bone_info.jpg",
    desc: "霸王龙的骨骼在演化中实现了极致的‘轻量化’。这种源自兽脚类恐龙的中空骨骼结构，是其保持敏捷与高效呼吸的基础。",
    features: ["完整化石骨架重建", "气腔骨剖面放大", "骨壁与气腔结构", "化石纹理特写", "呼吸系统关联示意"],
    stats: [{ label: "骨架特性", value: "气腔化" }, { label: "呼吸关联", value: "单向气囊" }]
  }
}

function DinoModel({ val }) {
  const skinGLTF = useGLTF('/skin.glb')
  const muscleGLTF = useGLTF('/muscle.glb')
  const boneGLTF = useGLTF('/bone.glb')
  const skinScene = useMemo(() => skinGLTF.scene.clone(), [skinGLTF])
  const muscleScene = useMemo(() => muscleGLTF.scene.clone(), [muscleGLTF])
  const boneScene = useMemo(() => boneGLTF.scene.clone(), [boneGLTF])
  const smoothVal = useRef(0)

  useFrame(() => {
    smoothVal.current = THREE.MathUtils.lerp(smoothVal.current, val, 0.1)
    const v = smoothVal.current
    const op = [Math.max(0, 1 - v / 100), v <= 100 ? v / 100 : Math.max(0, 1 - (v - 100) / 100), Math.max(0, (v - 100) / 100)]
    const scenes = [skinScene, muscleScene, boneScene]
    scenes.forEach((s, i) => {
      s.traverse(c => { if (c.isMesh) { c.material.transparent = true; c.material.opacity = op[i]; c.visible = op[i] > 0.01; } })
    })
  })

  return (
    <group scale={6.5} position={[0, -0.8, 0]} rotation={[0, -0.4, 0]}>
      <primitive object={skinScene} />
      <primitive object={muscleScene} />
      <primitive object={boneScene} />
    </group>
  )
}

export default function App() {
  const [val, setVal] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [imgScale, setImgScale] = useState(1) // 控制图片缩放

  const current = val < 60 ? DINO_DATA.skin : val < 140 ? DINO_DATA.muscle : DINO_DATA.bone

  // 监听窗口大小，实时自适应
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: isMobile ? 'column' : 'row',
      width: '100vw', height: '100vh', 
      background: '#f5f5f7', color: '#1d1d1f', 
      fontFamily: '"Inter", "Noto Sans SC", sans-serif',
      overflow: isMobile ? 'auto' : 'hidden' 
    }}>
      
      {/* --- 高级图片查看器 (可拖动、可缩放) --- */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
              background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)',
              zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 2100 }}>
              <button onClick={() => {setShowModal(false); setImgScale(1)}} style={{ padding: '10px 20px', cursor: 'pointer', borderRadius: '30px', border: '1px solid #ddd' }}>关闭查看器 ✕</button>
            </div>
            
            <div style={{ position: 'absolute', bottom: '30px', background: 'white', padding: '10px 20px', borderRadius: '30px', boxShadow: '0 5px 15px rgba(0,0,0,0.1)', display: 'flex', gap: '20px', zIndex: 2100 }}>
              <button onClick={() => setImgScale(s => Math.max(0.5, s - 0.2))}>缩小 -</button>
              <span style={{ fontSize: '0.8rem', color: '#888' }}>滚轮或按钮可缩放，鼠标可按住拖动查看细节</span>
              <button onClick={() => setImgScale(s => Math.min(3, s + 0.2))}>放大 +</button>
            </div>

            <motion.div 
              drag 
              dragConstraints={{ left: -500, right: 500, top: -500, bottom: 500 }}
              style={{ cursor: 'grab' }}
              onWheel={(e) => setImgScale(s => Math.min(3, Math.max(0.5, s - e.deltaY * 0.001)))}
            >
              <motion.img 
                animate={{ scale: imgScale }}
                src={current.image} 
                style={{ pointerEvents: 'none', maxWidth: '80vw', maxHeight: '80vh', borderRadius: '12px', boxShadow: '0 30px 60px rgba(0,0,0,0.2)' }} 
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. 左侧/顶部：标题与索引 */}
      <div style={{ 
        width: isMobile ? '100%' : '20%', 
        background: 'white', padding: '40px 30px', 
        borderRight: isMobile ? 'none' : '1px solid #e5e5e7',
        borderBottom: isMobile ? '1px solid #e5e5e7' : 'none',
        flexShrink: 0
      }}>
        <h2 style={{ fontSize: '0.7rem', color: '#86868b', letterSpacing: '3px', fontWeight: 700 }}>STUDIO DATA</h2>
        <h1 style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 900, margin: '10px 0 30px' }}>霸王龙</h1>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: '10px', overflowX: 'auto' }}>
          {['表层解构', '肌肉系统', '骨骼结构'].map((label, i) => (
            <div key={label} style={{ 
              padding: '12px 20px', borderRadius: '8px', flexShrink: 0,
              background: val >= i*100-50 && val <= i*100+50 ? '#1d1d1f' : '#f5f5f7', 
              color: val >= i*100-50 && val <= i*100+50 ? 'white' : '#86868b', 
              fontSize: '0.8rem', fontWeight: 700 
            }}>{label}</div>
          ))}
        </div>
      </div>

      {/* 2. 中间：3D 画布区 */}
      <div style={{ flex: 1, position: 'relative', height: isMobile ? '50vh' : 'auto', minHeight: '400px' }}>
        <Canvas shadows camera={{ position: [0, 1, 7], fov: 32 }}>
          <ambientLight intensity={1.5} />
          <spotLight position={[10, 15, 10]} intensity={2} />
          <Suspense fallback={<Html center>载入中...</Html>}>
            <DinoModel val={val} />
            <Environment preset="city" /> // city 通常比 studio 轻量
            <ContactShadows position={[0, -1.2, 0]} opacity={0.2} scale={15} blur={3} />
          </Suspense>
          <OrbitControls makeDefault enableDamping />
        </Canvas>

        {/* 控制器 */}
        <div style={{ position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', width: isMobile ? '90%' : '70%', zIndex: 100 }}>
          <div style={{ background: 'white', padding: '15px 30px', borderRadius: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <input type="range" min="0" max="200" value={val} onChange={(e) => setVal(parseInt(e.target.value))} style={{ width: '100%', cursor: 'pointer', accentColor: '#1d1d1f' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
              <div style={{ textAlign: 'left' }}><div style={{ fontSize: '0.6rem', fontWeight: 900 }}>EXTERIOR / 表层皮肤</div></div>
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: '0.6rem', fontWeight: 900 }}>MUSCULAR / 肌肉系统</div></div>
              <div style={{ textAlign: 'right' }}><div style={{ fontSize: '0.6rem', fontWeight: 900 }}>SKELETAL / 骨骼结构</div></div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 右侧/底部：百科面板 */}
      <div style={{ 
        width: isMobile ? '100%' : '25%', 
        background: 'white', borderLeft: isMobile ? 'none' : '1px solid #e5e5e7', 
        overflowY: isMobile ? 'visible' : 'auto' 
      }}>
        <div style={{ padding: '25px' }}>
          <div onClick={() => setShowModal(true)} style={{ width: '100%', height: '200px', borderRadius: '12px', overflow: 'hidden', cursor: 'zoom-in', position: 'relative', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}>
            <img key={current.image} src={current.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', bottom: 0, width: '100%', background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '0.55rem', padding: '6px', textAlign: 'center' }}>点击查看高清及更多细节图</div>
          </div>

          <div style={{ marginTop: '25px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '5px' }}>{current.title}</h2>
            <small style={{ color: '#0066cc', fontWeight: 800 }}>{current.en}</small>
            <p style={{ fontSize: '0.8rem', color: '#424245', lineHeight: '1.7', margin: '20px 0' }}>{current.desc}</p>

            <div style={{ marginBottom: '25px' }}>
              <h4 style={{ fontSize: '0.75rem', marginBottom: '10px', borderLeft: '3px solid #1d1d1f', paddingLeft: '8px' }}>关键技术解析</h4>
              {current.features.map(f => (
                <div key={f} style={{ fontSize: '0.75rem', color: '#666', marginBottom: '6px' }}>• {f}</div>
              ))}
            </div>

            <div style={{ display: 'grid', gap: '8px' }}>
              {current.stats.map(stat => (
                <div key={stat.label} style={{ background: '#f5f5f7', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span style={{ color: '#86868b' }}>{stat.label}</span>
                  <span style={{ fontWeight: 700 }}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}