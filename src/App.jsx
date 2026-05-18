import React, { useState, Suspense, useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment, ContactShadows, Html } from '@react-three/drei'
import * as THREE from 'three'

// --- 深度科研数据库 (整合用户提供信息) ---
const DINO_DATA = {
  skin: {
    title: "皮肤纹理与原始羽毛细节",
    en: "SKIN TEXTURE & PROTO-FEATHERS",
    image: "/skin_info.jpg", 
    desc: "霸王龙的外部包络不仅是防御屏障，更是复杂的生物感官系统。通过高倍率显微研究，我们还原了其从鳞片到原始羽毛的演化细节。",
    stats: [
      { label: "主要成分", value: "角质化鳞片" },
      { label: "羽毛分布", value: "颈/手臂/尾部" }
    ],
    features: [
      "皮肤剖面多层结构解析",
      "鳞片纹理高倍放大观测",
      "原始羽毛丝状结构复原",
      "角质外层（Keratin）特写",
      "躯干与四肢鳞片类型对比"
    ]
  },
  muscle: {
    title: "肌肉结构与咬合力分析",
    en: "MUSCLE & BITE FORCE ANALYSIS",
    image: "/muscle_info.jpg",
    desc: "霸王龙的肌肉系统是史前生物力学的巅峰。其巨大的咬肌和稳固的后肢肌群，使其具备了摧毁任何生物防御的恐怖力量。",
    stats: [
      { label: "最大咬合力", value: "12,800 lbf" },
      { label: "爆发推力", value: "约 8.0 吨" }
    ],
    features: [
      "全身肌肉解剖彩色编码图",
      "咬合力热力分布数据模型",
      "肌肉纤维收缩方向示意",
      "各肌群（M. adductor）功能说明",
      "肌肉横截面显微结构分析"
    ]
  },
  bone: {
    title: "骨骼结构与中空骨骼解析",
    en: "SKELETAL & PNEUMATIC SYSTEM",
    image: "/bone_info.jpg",
    desc: "霸王龙的骨骼在演化中实现了极致的‘轻量化’。这种源自兽脚类恐龙的中空骨骼结构，是其保持敏捷与高效呼吸的基础。",
    stats: [
      { label: "骨架特性", value: "气腔化 (Hollow)" },
      { label: "呼吸关联", value: "单向气囊系统" }
    ],
    features: [
      "完整化石骨骼三维重建",
      "气腔骨（Pneumatic）剖面放大",
      "骨壁厚度与气腔支撑结构",
      "实心骨 vs 中空骨力学对比",
      "骨骼系统与呼吸气囊关联示意"
    ]
  }
}

function DinoModel({ val }) {
  const { scene: skinScene } = useGLTF('/skin.glb')
  const { scene: muscleScene } = useGLTF('/muscle.glb')
  const { scene: boneScene } = useGLTF('/bone.glb')
  const smoothVal = useRef(0)

  useFrame(() => {
    smoothVal.current = THREE.MathUtils.lerp(smoothVal.current, val, 0.1)
    const v = smoothVal.current
    const op = [Math.max(0, 1 - v / 100), v <= 100 ? v / 100 : Math.max(0, 1 - (v - 100) / 100), Math.max(0, (v - 100) / 100)];
    [skinScene, muscleScene, boneScene].forEach((s, i) => {
      s.traverse(c => { if (c.isMesh) { c.material.transparent = true; c.material.opacity = op[i]; c.visible = op[i] > 0.01; } });
    });
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
  const current = val < 60 ? DINO_DATA.skin : val < 140 ? DINO_DATA.muscle : DINO_DATA.bone

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', background: '#f5f5f7', color: '#1d1d1f', fontFamily: '"Inter", "Noto Sans SC", sans-serif', overflow: 'hidden' }}>
      
      {/* --- 图片放大模态窗 (Modal) --- */}
      {showModal && (
        <div 
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out',
            animation: 'fadeIn 0.3s'
          }}
        >
          <div style={{ position: 'relative', maxWidth: '85%', maxHeight: '85%' }}>
            <img src={current.image} style={{ width: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} />
            <div style={{ color: 'white', marginTop: '15px', textAlign: 'center', fontSize: '0.9rem', opacity: 0.8 }}>点击任意位置关闭视图</div>
          </div>
        </div>
      )}

      {/* 1. 左侧栏 */}
      <div style={{ width: '20%', background: 'white', padding: '50px 30px', borderRight: '1px solid #e5e5e7', zIndex: 10 }}>
        <h2 style={{ fontSize: '0.7rem', color: '#86868b', letterSpacing: '3px', fontWeight: 700 }}>STUDIO DATA</h2>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 900, margin: '10px 0 60px' }}>霸王龙</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {['表层解构', '肌肉系统', '骨骼结构'].map((label, i) => (
            <div key={label} style={{ 
              padding: '20px', borderRadius: '12px', background: val >= i*100-50 && val <= i*100+50 ? '#1d1d1f' : '#f5f5f7', 
              color: val >= i*100-50 && val <= i*100+50 ? 'white' : '#86868b', transition: '0.3s', fontWeight: 700 
            }}>{label}</div>
          ))}
        </div>
      </div>

      {/* 2. 中间 3D 区 */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Canvas shadows camera={{ position: [0, 1, 7], fov: 32 }}>
          <ambientLight intensity={1.5} />
          <spotLight position={[10, 15, 10]} intensity={2} />
          <Suspense fallback={<Html center><div style={{color:'#86868b'}}>载入中...</div></Html>}>
            <DinoModel val={val} />
            <Environment preset="studio" />
            <ContactShadows position={[0, -1.2, 0]} opacity={0.2} scale={15} blur={3} />
          </Suspense>
          <OrbitControls makeDefault enableDamping />
        </Canvas>

        {/* 控制器 */}
        <div style={{ position: 'absolute', bottom: '50px', left: '50%', transform: 'translateX(-50%)', width: '60%', zIndex: 100 }}>
          <div style={{ background: 'white', padding: '25px 40px', borderRadius: '40px', boxShadow: '0 15px 40px rgba(0,0,0,0.08)' }}>
            <input type="range" min="0" max="200" value={val} onChange={(e) => setVal(parseInt(e.target.value))} style={{ width: '100%', cursor: 'pointer', accentColor: '#1d1d1f' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
              <div style={{ textAlign: 'left' }}><div style={{ fontSize: '0.65rem', fontWeight: 900 }}>EXTERIOR</div><div style={{ fontSize: '0.6rem', color: '#86868b' }}>表层皮肤</div></div>
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: '0.65rem', fontWeight: 900 }}>MUSCULAR</div><div style={{ fontSize: '0.6rem', color: '#86868b' }}>肌肉系统</div></div>
              <div style={{ textAlign: 'right' }}><div style={{ fontSize: '0.65rem', fontWeight: 900 }}>SKELETAL</div><div style={{ fontSize: '0.6rem', color: '#86868b' }}>骨骼结构</div></div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 右侧百科面板 */}
      <div style={{ width: '25%', background: 'white', borderLeft: '1px solid #e5e5e7', overflowY: 'auto', zIndex: 10 }}>
        {/* 图片交互区 */}
        <div style={{ padding: '30px 25px 10px' }}>
          <div 
            onClick={() => setShowModal(true)}
            style={{ 
              width: '100%', height: '220px', borderRadius: '16px', overflow: 'hidden', cursor: 'zoom-in',
              position: 'relative', background: '#f5f5f7', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', border: '1px solid #eee'
            }}
          >
            <img key={current.image} src={current.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', bottom: 0, width: '100%', background: 'rgba(0,0,0,0.4)', color: 'white', fontSize: '0.6rem', padding: '8px', textAlign: 'center', backdropFilter: 'blur(4px)' }}>
              点击查看高清细节图
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 30px' }}>
          <small style={{ color: '#0066cc', fontWeight: 800, fontSize: '0.75rem' }}>{current.en}</small>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: '8px 0 20px' }}>{current.title}</h2>
          
          <p style={{ fontSize: '0.85rem', color: '#424245', lineHeight: '1.8', marginBottom: '25px', textAlign: 'justify' }}>{current.desc}</p>

          {/* 包含内容清单 (New) */}
          <div style={{ marginBottom: '30px' }}>
            <h4 style={{ fontSize: '0.8rem', color: '#1d1d1f', marginBottom: '12px', borderLeft: '3px solid #1d1d1f', paddingLeft: '10px' }}>包含内容 / CONTENTS</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {current.features.map(f => (
                <div key={f} style={{ fontSize: '0.75rem', color: '#424245', display: 'flex', gap: '10px' }}>
                  <span style={{ color: '#0066cc' }}>•</span> {f}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gap: '10px', marginBottom: '30px' }}>
            {current.stats.map(stat => (
              <div key={stat.label} style={{ background: '#f5f5f7', padding: '15px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', border: '1px solid #f0f0f2' }}>
                <span style={{ fontSize: '0.75rem', color: '#86868b' }}>{stat.label}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  )
}