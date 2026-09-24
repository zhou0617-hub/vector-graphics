from pathlib import Path

path = Path(__file__).parent / "frontend" / "src" / "app" / "(main)" / "tools" / "image-upscale" / "page.tsx"
content = path.read_text(encoding="utf-8")

old = """      {showProgress && preview && (
        <div className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md flex flex-col items-center justify-center">
          <div className="w-[420px] h-[420px] max-w-[80vw] max-h-[60vh]">
            <ParticleProgress imageUrl={preview} progress={progress} />
          </div>
          <div className="mt-8 text-center">
            <p className="text-lg font-medium text-white mb-2">生成中... {Math.floor(progress)}%</p>
            <p className="text-sm text-white/40 mb-4">{MODES[mode].label}模式 · 预计 {MODES[mode].estimate.replace('约 ', '')}</p>
            <button onClick={handleCancel} className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 border border-white/15 text-white/80 hover:bg-white/15 transition-colors text-sm">
              <StopCircle className="w-4 h-4" /> 终止转换
            </button>
          </div>
        </div>
      )}"""

new = """      {showProgress && preview && (
        <div className="fixed inset-0 z-[200] bg-black/88 backdrop-blur-md flex flex-col items-center justify-center px-4">
          <div className="w-full max-w-[900px]" style={{ height: 'min(65vh, 600px)' }}>
            <ParticleProgress imageUrl={preview} progress={progress} onRegatherComplete={handleRegatherComplete} />
          </div>
          <div className="mt-6 text-center">
            <p className="text-lg font-medium text-white mb-2">生成中... {Math.floor(progress)}%</p>
            <p className="text-sm text-white/40 mb-4">{MODES[mode].label}模式 · 预计 {MODES[mode].estimate.replace('约 ', '')}</p>
            <button onClick={handleCancel} className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 border border-white/15 text-white/80 hover:bg-white/15 transition-colors text-sm">
              <StopCircle className="w-4 h-4" /> 终止转换
            </button>
          </div>
        </div>
      )}"""

if old in content:
    content = content.replace(old, new, 1)
    path.write_text(content, encoding="utf-8")
    print("  [修改] image-upscale/page.tsx - 遮罩层结构")
else:
    print("  [警告] image-upscale 未找到遮罩层锚点")
