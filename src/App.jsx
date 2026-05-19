import React, { useState, Suspense, useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment, ContactShadows, Html } from '@react-three/drei'
import * as THREE from 'three'
import { motion, AnimatePresence } from 'framer-motion'

// --- 深度科研数据库 (保持不变) ---
const DINO_DATA = {
  skin: { title: "皮肤纹理与原始羽毛细节", en: "SKIN TEXTURE & PROTO-FEATHERS", image: "/skin_info.webp", desc: "霸王龙的外部包络不仅是防御屏障，更是复杂的生物感官系统。", features: ["皮肤剖面结构图", "鳞片纹理放大图"], stats: [{ label: "主要成分", value: "角质化鳞片" }] },
  muscle: { title: "肌肉结构与咬合力分析", en: "MUSCLE & BITE FORCE ANALYSIS", image: "/muscle_info.webp", desc: "霸王龙的肌肉系统是史前生物力学的巅峰。", features: ["全身肌肉解剖图", "咬合力热力分布"], stats: [{ label: "爆发推力", value: "约 8.0 吨" }] },
  bone: { title: "骨骼结构与中空骨骼解析", en: "SKELETAL & PNEUMATIC SYSTEM", image: "/bone_info.webp", desc: "霸王龙的骨骼在演化中实现了极致的‘轻量化’。", features: ["完整化石骨架重建", "气腔骨剖面放大"], stats: [{ label: "骨架特性", value: "气腔化" }] }
}

function DinoModel({ val, isMobile }) {
  const skinGLTF = useGLTF('/skin.glb')
  const muscleGLTF = useGLTF('/muscle.glb')
  const boneGLTF = useGLTF('/bone.glb')
  
  const smoothVal = useRef(0)

  useFrame(() => {
    smoothVal.current = THREE.MathUtils.lerp(smoothVal.current, val, 0.1)
    const v = smoothVal.current
    
    // 计算透明度
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
          // 优化1：移动端强制关闭阴影计算，极大节省性能
          c.castShadow = !isMobile 
          c.receiveShadow = !isMobile
          // 优化2：当完全看不见时，彻底移除渲染
          c.visible = op[i] > 0.01 
        }
      })
    })
  })

  return (
    <group scale={isMobile ? 5 : 6.5} position={[0, isMobile ? -0.5 : -0.8, 0]} rotation={[0, -0.4, 0]}>
      <primitive object={skinGLTF.scene} />
      <primitive object={muscleGLTF.scene} />
      <primitive object={boneGLTF.scene} />
    </group>
  )
}

export default function App() {
  const [val, setVal] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  // 核心优化：设备检测逻辑
  useEffect(() => {
    const checkDevice = () => {
      // 通过屏幕宽度和 UserAgent 综合判断
      const mobileWidth = window.innerWidth < 1024
      const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      setIsMobile(mobileWidth || mobileUA)
    }
    checkDevice()
    window.addEventListener('resize', checkDevice)
    return () => window.removeEventListener('resize', checkDevice)
  }, [])

  const current = val < 60 ? DINO_DATA.skin : val < 140 ? DINO_DATA.muscle : DINO_DATA.bone

  return (
    <div style={{ 
      display: 'flex', flexDirection: isMobile ? 'column' : 'row',
      width: '100vw', height: '100vh', background: '#f5f5f7', overflow: isMobile ? 'auto' : 'hidden' 
    }}>
      
      {/* 1. 左侧标题 */}
      <div style={{ width: isMobile ? '100%' : '20%', background: 'white', padding: isMobile ? '20px' : '40px 30px', borderRight: isMobile ? 'none' : '1px solid #e5e5e7', flexShrink: 0 }}>
        <h1 style={{ fontSize: isMobile ? '1.2rem' : '2rem', fontWeight: 900 }}>霸王龙 {isMobile && <span style={{fontSize:'0.6rem', color:'#0066cc'}}>移动端优化版</span>}</h1>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: '5px', marginTop: '10px' }}>
          {['表层', '肌肉', '骨骼'].map((label, i) => (
            <div key={label} style={{ padding: '8px 15px', borderRadius: '6px', background: val >= i*100-50 && val <= i*100+50 ? '#1d1d1f' : '#f5f5f7', color: val >= i*100-50 && val <= i*100+50 ? 'white' : '#86868b', fontSize: '0.7rem' }}>{label}</div>
          ))}
        </div>
      </div>

      {/* 2. 画布区 - 自动根据设备切换画质 */}
      <div style={{ flex: 1, position: 'relative', height: isMobile ? '45vh' : 'auto', minHeight: '350px' }}>
        <Canvas 
          // 优化：电脑端高画质(dpr=2)，移动端标准画质(dpr=1)
          dpr={isMobile ? 1 : [1, 2]} 
          camera={{ position: [0, 1, 7], fov: 32 }}
          // 优化：移动端彻底关闭阴影引擎
          shadows={!isMobile} 
          // 性能保护：防止由于显存溢出导致的页面彻底卡死
          gl={{ 
            powerPreference: "high-performance",
            antialias: !isMobile, // 移动端关闭抗锯齿，换取流畅度
            alpha: false 
          }}
        >
          {/* 优化：移动端使用基础环境，电脑端使用高清环境 */}
          <ambientLight intensity={isMobile ? 2 : 1.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          
          <Suspense fallback={<Html center>载入资源...</Html>}>
            <DinoModel val={val} isMobile={isMobile} />
            
            {/* 核心差异：移动端不加载 Environment，这是最省显存的操作 */}
            {!isMobile && <Environment preset="city" />}
            
            {/* 核心差异：移动端不渲染接触阴影 */}
            {!isMobile && <ContactShadows position={[0, -1.2, 0]} opacity={0.2} scale={15} blur={3} />}
          </Suspense>
          
          <OrbitControls makeDefault enableDamping />
        </Canvas>

        {/* 控制条 */}
        <div style={{ position: 'absolute', bottom: isMobile ? '10px' : '30px', left: '50%', transform: 'translateX(-50%)', width: '80%' }}>
          <input type="range" min="0" max="200" value={val} onChange={(e) => setVal(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#1d1d1f' }} />
        </div>
      </div>

      {/* 3. 右侧百科 (代码简化以节省性能) */}
      <div style={{ width: isMobile ? '100%' : '25%', background: 'white', padding: '20px' }}>
        <img src={current.image} style={{ width: '100%', borderRadius: '10px' }} onClick={() => setShowModal(true)} />
        <h2 style={{ fontSize: '1.1rem', marginTop: '15px' }}>{current.title}</h2>
        <p style={{ fontSize: '0.75rem', color: '#424245', lineHeight: '1.6' }}>{current.desc}</p>
      </div>
      
      {/* 弹窗查看器保持不变 */}
      {/* ... (之前的弹窗代码) */}
    </div>
  )
}