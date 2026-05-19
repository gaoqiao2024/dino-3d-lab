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
    image: "/skin_info.webp", 
    desc: "霸王龙的外部包络不仅是防御屏障，更是复杂的生物感官系统。通过高倍率显微研究，我们还原了其从鳞片到原始羽毛的演化细节。",
    features: ["皮肤剖面结构图", "鳞片纹理放大图", "原始羽毛细节", "角质外层特写", "鳞片类型对比"],
    stats: [{ label: "主要成分", value: "角质化鳞片" }, { label: "羽毛分布", value: "颈/手臂/尾部" }]
  },
  muscle: {
    title: "肌肉结构与咬合力分析",
    en: "MUSCLE & BITE FORCE ANALYSIS",
    image: "/muscle_info.webp",
    desc: "霸王龙的肌肉系统是史前生物力学的巅峰。其巨大的咬肌和稳固的后肢肌群，使其具备了摧毁任何生物防御的恐怖力量。",
    features: ["全身肌肉解剖图", "咬合力热力分布", "最大咬合力 12,800 lbf", "肌肉纤维方向示意", "肌肉显微结构"],
    stats: [{ label: "爆发推力", value: "约 8.0 吨" }, { label: "咬合压力", value: "极高" }]
  },
  bone: {
    title: "骨骼结构与中空骨骼解析",
    en: "SKELETAL & PNEUMATIC SYSTEM",
    image: "/bone_info.webp",
    desc: "霸王龙的骨骼在演化中实现了极致的‘轻量化’。这种源自兽脚类恐龙的中空骨骼结构，是其保持敏捷与高效呼吸的基础。",
    features: ["完整化石骨架重建", "气腔骨剖面放大", "骨壁与气腔结构", "化石纹理特写", "呼吸系统关联示意"],
    stats: [{ label: "骨架特性", value: "气腔化" }, { label: "呼吸关联", value: "单向气囊" }]
  }
}

function DinoModel({ val }) {
  // 优化1：直接引用，不再使用 .clone()，节省一倍内存
  const skinGLTF = useGLTF('/skin.glb')
  const muscleGLTF = useGLTF('/muscle.glb')
  const boneGLTF = useGLTF('/bone.glb')
  
  const smoothVal = useRef(0)

  useFrame(() => {
    smoothVal.current = THREE.MathUtils.lerp(smoothVal.current, val, 0.1)
    const v = smoothVal.current
    
    // 计算三个模型的透明度
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
          // 优化2：当不可见时完全跳过渲染，极大提升手机性能
          c.visible = op[i] > 0.01 
        }
      })
    })
  })

  return (
    <group scale={6.5} position={[0, -0.8, 0]} rotation={[0, -0.4, 0]}>
      <primitive object={skinGLTF.scene} />
      <primitive object={muscleGLTF.scene} />
      <primitive object={boneGLTF.scene} />
    </group>
  )
}

export default function App() {
  const [val, setVal] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)
  const [imgScale, setImgScale] = useState(1)

  const current = val < 60 ? DINO_DATA.skin : val < 140 ? DINO_DATA.muscle : DINO_DATA.bone

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
      overflow: isMobile ? 'auto' : 'hidden' 
    }}>
      
      {/* 弹窗部分保持不变 */}
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
              <button onClick={() => {setShowModal(false); setImgScale(1)}} style={{ padding: '10px 20px', cursor: 'pointer', borderRadius: '30px', border: '1px solid #ddd' }}>关闭 ✕</button>
            </div>
            <motion.div drag onWheel={(e) => setImgScale(s => Math.min(3, Math.max(0.5, s - e.deltaY * 0.001)))}>
              <motion.img animate={{ scale: imgScale }} src={current.image} style={{ maxWidth: '80vw', maxHeight: '80vh', borderRadius: '12px', boxShadow: '0 30px 60px rgba(0,0,0,0.2)' }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 左侧标题区 */}
      <div style={{ width: isMobile ? '100%' : '20%', background: 'white', padding: '40px 30px', borderRight: isMobile ? 'none' : '1px solid #e5e5e7', borderBottom: isMobile ? '1px solid #e5e5e7' : 'none', flexShrink: 0 }}>
        <h2 style={{ fontSize: '0.7rem', color: '#86868b', letterSpacing: '3px', fontWeight: 700 }}>STUDIO DATA</h2>
        <h1 style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 900, margin: '10px 0 30px' }}>霸王龙</h1>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: '10px' }}>
          {['表层解构', '肌肉系统', '骨骼结构'].map((label, i) => (
            <div key={label} style={{ padding: '12px 20px', borderRadius: '8px', background: val >= i*100-50 && val <= i*100+50 ? '#1d1d1f' : '#f5f5f7', color: val >= i*100-50 && val <= i*100+50 ? 'white' : '#86868b', fontSize: '0.8rem', fontWeight: 700 }}>{label}</div>
          ))}
        </div>
      </div>

      {/* 中间画布区 - 重点优化 */}
      <div style={{ flex: 1, position: 'relative', height: isMobile ? '50vh' : 'auto', minHeight: '400px' }}>
        {/* 优化3：dpr={[1, 2]} 限制像素比，防止高分屏手机卡死。去掉了 shadows 属性 */}
        <Canvas dpr={[1, 2]} camera={{ position: [0, 1, 7], fov: 32 }}>
          <ambientLight intensity={1.5} />
          <pointLight position={[10, 10, 10]} intensity={1} /> 
          <Suspense fallback={<Html center>载入中...</Html>}>
            <DinoModel val={val} />
            {/* 优化4：Environment 很容易导致移动端崩溃，如果还白屏，请删掉下面这一行 */}
            <Environment preset="city" /> 
          </Suspense>
          <OrbitControls makeDefault enableDamping />
        </Canvas>

        {/* 滑动条 */}
        <div style={{ position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', width: isMobile ? '90%' : '70%', zIndex: 100 }}>
          <div style={{ background: 'white', padding: '15px 30px', borderRadius: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <input type="range" min="0" max="200" value={val} onChange={(e) => setVal(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#1d1d1f' }} />
          </div>
        </div>
      </div>

      {/* 右侧面板 */}
      <div style={{ width: isMobile ? '100%' : '25%', background: 'white', borderLeft: isMobile ? 'none' : '1px solid #e5e5e7' }}>
        <div style={{ padding: '25px' }}>
          <img onClick={() => setShowModal(true)} src={current.image} style={{ width: '100%', borderRadius: '12px', cursor: 'pointer' }} />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 900, marginTop: '20px' }}>{current.title}</h2>
          <p style={{ fontSize: '0.8rem', color: '#424245', lineHeight: '1.7' }}>{current.desc}</p>
        </div>
      </div>
    </div>
  )
}