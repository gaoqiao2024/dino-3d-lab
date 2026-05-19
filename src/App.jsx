import React, { useState, Suspense, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment, Html, useProgress } from '@react-three/drei'
import * as THREE from 'three'
import { motion, AnimatePresence } from 'framer-motion'

// --- 💖 琥珀金科学配色方案 ---
const THEME = {
  bgGradient: 'radial-gradient(circle, #353535 0%, #121212 100%)', // 舞台灯光感背景
  accent: '#E67E22', // 琥珀橙/金
  textLight: '#F2F2F7',
  textDark: '#1C1C1E',
  cardBg: '#FFFFFF',
  glass: 'rgba(255, 255, 255, 0.1)'
}

// --- 💖 恐龙总数据库：在这里添加新恐龙 ---
const DINO_LIST = [
  {
    id: "trex",
    name: "霸王龙",
    enName: "T-Rex",
    thumb: "/thumb.webp", // 左侧的小缩略图
    models: { skin: "/skin.glb", muscle: "/muscle.glb", bone: "/bone.glb" },
    layers: {
      skin: { title: "🦖 霸王龙皮肤秘密", enTitle: "SKIN TEXTURE SECRETS", image: "/skin_info.webp", desc: "最新的研究发现，霸王龙并非全身只有冷冰冰的鳞片。", tags: ["#皮肤管理", "#原始羽毛"], details: [{ icon: "🛡️", label: "防御系统 Defense", text: "坚硬角质层" }] },
      muscle: { title: "💪 最强咬合力解析", enTitle: "POWERFUL BITE FORCE", image: "/muscle_info.webp", desc: "霸王龙拥有生物史上最恐怖的咬肌！", tags: ["#碎骨机", "#核心训练"], details: [{ icon: "🦷", label: "咬肌强度 Bite", text: "6吨恐怖咬合力" }] },
      bone: { title: "🦴 中空骨骼黑科技", enTitle: "SKELETAL TECHNOLOGY", image: "/bone_info.webp", desc: "它的骨头是“中空气腔”结构！🕊️ 这种设计让它既轻盈又坚固。", tags: ["#中空骨骼", "#轻量化"], details: [{ icon: "🏗️", label: "结构 Structure", text: "蜂窝状轻量化" }] }
    }
  },
  {
    id: "triceratops",
    name: "三角龙",
    enName: "Triceratops",
    thumb: "/tri_thumb.webp", // 你需要准备一张三角龙的小图放在 public
    models: { skin: "/tri_skin.glb", muscle: "/tri_muscle.glb", bone: "/tri_bone.glb" }, // 你的三角龙模型路径
    layers: {
      skin: { title: "🛡️ 角龙类防御工事", enTitle: "DEFENSIVE SHIELD", image: "/tri_skin_info.webp", desc: "三角龙最引人注目的就是巨大的颈盾和三只尖角。", tags: ["#坦克级防御", "#颈盾之谜"], details: [{ icon: "🛡️", label: "颈盾结构 Shield", text: "实心骨质，防御颈部" }] },
      muscle: { title: "💪 结实的四肢肌群", enTitle: "QUADRUPEDAL POWER", image: "/tri_muscle_info.webp", desc: "作为食草界的“重装坦克”，三角龙拥有极其强壮的前肢肌肉。", tags: ["#核心肌群", "#重装坦克"], details: [{ icon: "🦵", label: "负重力 Support", text: "支撑约 6-12 吨体重" }] },
      bone: { title: "🦴 坚实的实心骨骼", enTitle: "SOLID BONE STRUCTURE", image: "/tri_bone_info.webp", desc: "不同于霸王龙的中空，三角龙的骨骼更加厚重、密实。", tags: ["#实心骨骼", "#稳如泰山"], details: [{ icon: "📐", label: "头骨比例 Skull", text: "头骨占体长约 1/3" }] }
    }
  }
];

function Loader() {
  const { progress } = useProgress()
  return (
    <Html center><div style={{ color: '#fff', fontSize: '10px', letterSpacing: '2px', background: 'rgba(255,165,0,0.2)', padding: '10px 20px', borderRadius: '20px', backdropFilter: 'blur(5px)' }}>LOADING {Math.round(progress)}%</div></Html>
  )
}

// 别忘了在文件最顶部加上这一行：
// import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'

function DinoModel({ val, isMobile, modelPaths }) {
  // 增加解压器配置，防止苹果端崩溃
  const dracoConf = (loader) => {
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.5/')
    loader.setDRACOLoader(dracoLoader)
  }

  // 使用带配置的加载器
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
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 10000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', touchAction: 'none' }}>
      
      <div style={{ position: 'absolute', top: '30px', width: '100%', display: 'flex', justifyContent: 'space-between', padding: '0 30px', boxSizing: 'border-box' }}>
        <div style={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>查看细节 / View Detail</div>
        <button onClick={onClose} style={{ background: THEME.accent, color: '#fff', border: 'none', padding: '10px 25px', borderRadius: '30px', fontWeight: 'bold' }}>关闭 ✕</button>
      </div>

      <motion.div drag dragConstraints={{ left: -300, right: 300, top: -300, bottom: 300 }} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.img animate={{ scale }} transition={{ type: 'spring', damping: 25 }} src={src} style={{ maxWidth: '95vw', maxHeight: '75vh', borderRadius: '15px', boxShadow: '0 0 50px rgba(230, 126, 34, 0.3)' }} />
      </motion.div>

      <div style={{ position: 'absolute', bottom: '50px', width: '80%', background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '30px', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <span style={{ color: '#fff', fontSize: '12px' }}>缩小 -</span>
        <input type="range" min="0.5" max="3" step="0.1" value={scale} onChange={(e) => setScale(parseFloat(e.target.value))} style={{ flex: 1, accentColor: THEME.accent }} />
        <span style={{ color: '#fff', fontSize: '12px' }}>放大 +</span>
      </div>
    </motion.div>
  )
}

export default function App() {
  const [val, setVal] = useState(0)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)
  const [viewerOpen, setViewerOpen] = useState(false)
  
  // --- 新增：记录当前选中的恐龙 (默认选第一只，即霸王龙) ---
  const [activeDinoIndex, setActiveDinoIndex] = useState(0)
  const activeDino = DINO_LIST[activeDinoIndex]

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 修改 current 的获取方式，从 activeDino 里拿数据
  const current = val < 60 ? activeDino.layers.skin : val < 140 ? activeDino.layers.muscle : activeDino.layers.bone

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', width: '100vw', height: '100vh', background: THEME.bgGradient, color: THEME.textLight, overflow: isMobile ? 'auto' : 'hidden' }}>
      <AnimatePresence>{viewerOpen && <ImageViewer src={current.image} onClose={() => setViewerOpen(false)} />}</AnimatePresence>

      {/* 顶部标题栏 */}
      <div style={{ position: 'fixed', top: 0, width: '100%', height: '55px', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(15px)', display: 'flex', alignItems: 'center', padding: '0 25px', zIndex: 500, borderBottom: '1px solid rgba(255,255,255,0.05)', boxSizing: 'border-box' }}>
        <div style={{ fontSize: '12px', fontWeight: 900, letterSpacing: '2px', color: THEME.accent }}>恐龙科学实验室 <span style={{ color: '#888', fontWeight: 300, marginLeft: '10px' }}>DINOSCIENCE LAB</span></div>
      </div>

      {/* 1. 左侧栏 (仅电脑端) */}
      {!isMobile && (
  <div style={{ width: '180px', padding: '80px 15px', borderRight: '1px solid rgba(255,255,255,0.05)', flexShrink: 0, background: 'rgba(0,0,0,0.2)', overflowY: 'auto' }}>
    {/* 1. 物种切换区 */}
    <div style={{ marginBottom: '30px' }}>
      <div style={{ fontSize: '10px', color: THEME.accent, fontWeight: 'bold', marginBottom: '15px' }}>物种库 SPECIES</div>
      {DINO_LIST.map((dino, index) => (
        <div key={dino.id} 
          onClick={() => { setActiveDinoIndex(index); setVal(0); }} 
          style={{ 
            display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '12px', marginBottom: '10px', cursor: 'pointer',
            background: activeDinoIndex === index ? 'rgba(230, 126, 34, 0.2)' : 'transparent',
            border: activeDinoIndex === index ? `1px solid ${THEME.accent}` : '1px solid transparent'
          }}>
          <img src={dino.thumb} style={{ width: '30px', height: '30px', borderRadius: '6px', objectFit: 'cover' }} />
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: activeDinoIndex === index ? '#fff' : '#666' }}>{dino.name}</div>
        </div>
      ))}
    </div>

    {/* 2. 原有的层级切换区 */}
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
      <div style={{ fontSize: '10px', color: '#444', fontWeight: 'bold', marginBottom: '15px' }}>解剖层 LAYERS</div>
      {['皮肤 SKIN', '肌肉 MUSCLE', '骨骼 BONE'].map((label, i) => (
        <div key={label} style={{ padding: '12px 10px', borderRadius: '10px', marginBottom: '10px', fontSize: '10px', textAlign: 'center', background: val >= i*100-50 && val <= i*100+50 ? THEME.accent : 'rgba(255,255,255,0.05)', color: val >= i*100-50 && val <= i*100+50 ? '#fff' : '#666', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => setVal(i*100)}>{label}</div>
      ))}
    </div>
  </div>
)}

      {/* 2. 中间 3D 画布 */}
      <div style={{ flex: 1, position: 'relative', height: isMobile ? '55vh' : 'auto', minHeight: isMobile ? '400px' : 'auto' }}>
        <Canvas dpr={isMobile ? 1 : [1, 2]} camera={{ position: [0, 1, 8], fov: 28 }}>
          <ambientLight intensity={2.5} /> {/* 增加环境光亮度 */}
          <pointLight position={[10, 10, 10]} intensity={2} color={THEME.accent} /> {/* 加入琥珀色调点光源 */}
          <spotLight position={[-10, 10, 10]} intensity={1} />
          <Suspense fallback={<Loader />}>
  {/* key 极其重要！它能保证切换恐龙时模型重新加载，而不是叠在一起 */}
  <DinoModel 
    key={activeDino.id} 
    val={val} 
    isMobile={isMobile} 
    modelPaths={activeDino.models} 
  />
</Suspense>
          <OrbitControls makeDefault enableDamping minDistance={5} maxDistance={15} />
        </Canvas>

        {/* 悬浮控制条 */}
        <div style={{ position: 'absolute', bottom: '35px', left: '50%', transform: 'translateX(-50%)', width: '85%', textAlign: 'center', zIndex: 100 }}>
          <input type="range" min="0" max="200" value={val} onChange={(e) => setVal(parseInt(e.target.value))} style={{ width: '100%', cursor: 'pointer', accentColor: THEME.accent }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>
            <span style={{ color: val < 60 ? THEME.accent : '' }}>皮肤 / SKIN</span>
            <span style={{ color: val >= 60 && val < 140 ? THEME.accent : '' }}>肌肉 / MUSCLE</span>
            <span style={{ color: val >= 140 ? THEME.accent : '' }}>骨骼 / BONE</span>
          </div>
        </div>
      </div>

      {/* 3. 右侧百科面板 */}
      <div style={{ width: isMobile ? '100%' : '380px', background: THEME.cardBg, color: THEME.textDark, borderTopLeftRadius: isMobile ? '30px' : '40px', borderBottomLeftRadius: isMobile ? '0' : '40px', boxShadow: '-20px 0 40px rgba(0,0,0,0.3)', overflowX: 'hidden' }}>
        <div style={{ padding: '35px' }}>
          {isMobile && (
            <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
              {['皮肤', '肌肉', '骨骼'].map((l, i) => (
                <div key={l} onClick={() => setVal(i*100)} style={{ flex: 1, padding: '12px', borderRadius: '12px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', background: val >= i*100-50 && val <= i*100+50 ? THEME.accent : '#f5f5f7', color: val >= i*100-50 && val <= i*100+50 ? '#fff' : '#86868b' }}>{l}</div>
              ))}
            </div>
          )}

          <div onClick={() => setViewerOpen(true)} style={{ position: 'relative', borderRadius: '20px', overflow: 'hidden', cursor: 'zoom-in', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <img key={current.image} src={current.image} style={{ width: '100%', display: 'block' }} />
            <div style={{ position: 'absolute', bottom: '15px', right: '15px', background: 'rgba(230, 126, 34, 0.9)', color: '#fff', padding: '8px 15px', borderRadius: '20px', fontSize: '10px', fontWeight: 'bold' }}>🔍 点击放大 / View Detail</div>
          </div>

          <div style={{ marginTop: '30px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              {current.tags.map(tag => <span key={tag} style={{ color: THEME.accent, fontSize: '11px', fontWeight: 'bold' }}>{tag}</span>)}
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '2px', color: '#1a1a1a' }}>{current.title}</h2>
            <div style={{ fontSize: '13px', color: '#999', fontWeight: 'bold', marginBottom: '20px' }}>{current.enTitle}</div>
            <p style={{ fontSize: '14px', color: '#424245', lineHeight: '1.8', textAlign: 'justify' }}>{current.desc}</p>

            <div style={{ display: 'grid', gap: '15px', marginTop: '30px' }}>
              {current.details.map(item => (
                <div key={item.label} style={{ background: '#f8f9fa', padding: '18px', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid #eee' }}>
                  <span style={{ fontSize: '28px' }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '900', color: THEME.accent }}>{item.label}</div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>{item.text}</div>
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