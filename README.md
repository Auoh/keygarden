# 键息花园 · Keygarden

> 你工作，它下雨。你停下，它入夜。

一个活在桌面角落的安静小游戏：**正常打字，它就会慢慢生长**。不用记按键、不用切换窗口、也不用改工作习惯。

![键息花园在桌面角落](docs/screenshots/desktop-modern.png)

> 截图使用演示数据。悬浮窗是透明、桌面层、鼠标穿透的；实际运行时它只占屏幕右下角一小块。
>
> 体验流程与下一版改版提案（PPT）：[keygarden-A-flow.pptx](docs/keygarden-A-flow.pptx)

## 现在是什么状态

**Mode A · 键息花园** 已实现并可运行。  
**Mode B · 桌边远行** 已进入可运行 MVP：底部旅行风景带、路程、扎营、每日旅行明信片。  
**Mode C · 键盘小镇** 仍在模式选择器中显示为 `SOON`。

B/C 的完整概念图：[B 桌边远行](concepts/b.jpg) · [C 键盘小镇](concepts/c.jpg)  
B 的实现说明：[Mode B · 桌边远行](docs/mode-b.md)

当前版本是一个 Windows x64 桌面原型，重点是验证：

1. 正常工作时的键盘节奏，能否驱动一个好玩、但不打扰人的小世界；
2. 全局键盘观察能否做到“只理解节奏，不理解内容”；
3. 一天结束时的一张明信片，是否足够成为回来的理由。

## 它会怎么玩

- **工作的时候**：右下角生态瓶里的天气会变化。连续输入起风、下雨；停顿久了，进入夜晚，萤火虫和薄雾出来；退格键被理解为修剪，不是犯错。
- **按键类别**决定长什么：字母养蕨类，数字养蘑菇，标点养花，空格和回车让苔藓蔓延。
- **一天结束**：会有一张“今日花园”明信片，记录今天的雨型、一起亮着的时间、停顿次数，以及新长出的植物。
- **几周之后**：花园会留下不同工作节奏形成的物种变种，像一本只有你自己能读懂的天气年鉴。
- **没有失败**：植物不会因为你开会、请假或忘记打开而枯死。休息是夜间模式，不是惩罚。

![花园手帐](docs/screenshots/journal-modern.png)

### Mode B · 桌边远行（MVP）

![桌边远行](docs/screenshots/journey-b.png)

你工作，他赶路；你停下，他扎营。手帐里的 Mode B 面板可以直接切换到这条底部风景带。实现说明见 [docs/mode-b.md](docs/mode-b.md)。

B 的美术素材提示词（6 张背景 + 旅人 + 营地，按图拆分）：[docs/journey-image-prompts.md](docs/journey-image-prompts.md)。当前代码绘制的风景是素材缺失时的 fallback。

## 功能

- 透明、桌面层、鼠标穿透的桌面悬浮窗，不抢焦点
- 可选“窗口置顶”：默认关闭，需要盖在工作窗口上方时再打开
- A/B 窗口都可拖动：鼠标移到悬浮窗上会亮起细边框，按住即可拖到屏幕任意位置；A/B 位置分别记忆
- 全局键盘节奏采集（只读键类与时间，不读字符）
- 5 阶段生态瓶照片随打字生长，按键触发一次轻微脉冲与孢子
- 天气、昼夜、植物生长、萤火虫、雨水与池塘动画
- 每日总结与明信片，保留最近 90 天
- 系统托盘：打开手帐、显示/隐藏花园、暂停、开机启动、退出
- 全局快捷键
- 本地 JSON 存档，无网络
- 游戏模式选择器：A 已开放，B 已可切换进入，C 预留
- B 模式：底部旅行风景带、路程推进、扎营、纪念品与旅行明信片
- 自动锁屏/休眠暂停观察器
- 单元测试覆盖节奏分类、日切、成长、明信片、上限、B 路线与模式切换

## 生长画面素材

悬浮窗使用 5 张 2:3 的生态瓶照片做阶段交叉淡化，打字越久，花园越往后一阶段。现在**浅色和深色两套实拍图都已接入**，默认使用浅色；可以在手帐设置或系统托盘里切换。

![浅色生长画面](docs/screenshots/overlay-light-real.png)

![深色生长画面](docs/screenshots/overlay-dark-real.png)

- 放到：`src/renderer/overlay/assets/garden/light/stage-0.jpg` … `stage-4.jpg`（或 `dark/`）
- 主题切换：手帐设置里的“界面主题”，或系统托盘 → 界面主题
- 规格与提示词：[docs/garden-image-prompts.md](docs/garden-image-prompts.md)
- 每张图单独一条完整提示词：[docs/prompts/](docs/prompts/)（图 01–10）
- 素材说明：[src/renderer/overlay/assets/garden/README.md](src/renderer/overlay/assets/garden/README.md)
- 只做一套主题也可以；两套都有时默认浅色

### 移动悬浮窗

默认保持鼠标穿透，不会挡住下面的工作窗口。把鼠标移到悬浮窗上时：

- 卡片边缘会亮起一圈很细的荧光绿边
- 按住鼠标左键，直接拖到屏幕上的任意位置——包括桌面左侧
- 松开鼠标，位置立即记住；鼠标移开后恢复穿透
- A 的生态瓶和 B 的旅行风景带位置分别保存，重启后保持

如果悬浮窗被其他窗口挡住，可以点手帐右上角 **移动窗口**，或系统托盘 → **移动窗口（20 秒）**：窗口会临时到最前，并出现虚线框和“拖动窗口 · Esc 锁定”，拖完按 `Esc` 或等待自动锁定。托盘里也有 **重置窗口位置**。

### 窗口置顶（可选）

默认不置顶，让工作窗口永远在上面。需要小摆件盖住工作窗口时，打开：

- 手帐设置 → **窗口置顶**
- 或系统托盘 → **窗口置顶**

置顶时仍然鼠标穿透；关闭后恢复正常桌面层。A/B 共用这个开关。

## 快速开始

### 环境

- Windows 10/11 x64
- Node.js 20+
- 构建键盘观察器需要 .NET Framework 4.x（Windows 10/11 通常自带）

### 开发运行

```powershell
npm install
npm run build:helper
npm start
```

如果 PowerShell 执行策略拦截脚本，使用：

```powershell
npm run start:win
```

第一次启动会打开花园手帐。点“把它放到角落”之后，手帐会收起，右下角的透明花园开始工作。

### 安装到用户目录

```powershell
npm run package
npm run install:local
```

这会把可运行的便携版复制到：

```text
%LOCALAPPDATA%\Programs\Keygarden
```

并在桌面创建 `Keygarden.lnk`。应用数据保存在 `%APPDATA%\Keygarden`，升级程序不会覆盖你的花园。

> 便携包大约 347 MB，主要来自 Electron 运行时。仓库不提交构建产物。

## 快捷键

| 快捷键 | 作用 |
|---|---|
| `Ctrl+Alt+G` | 打开花园手帐 |
| `Ctrl+Alt+H` | 显示 / 隐藏角落花园 |
| `Ctrl+Alt+Space` | 暂停 / 继续记录 |

所有快捷键都可以先通过托盘使用；如果注册失败，手帐里会显示观察器状态。

## 隐私

**只记录节奏和键类，不记录内容。**

- 观察器 `KeygardenKeys.exe` 只输出 `letter / digit / punct / space / enter / backspace` 类别与时间戳；
- 不保存字符、按键序列、窗口标题、剪贴板、屏幕内容；
- 不联网，无遥测；
- 暂停时观察器进程会被结束，锁屏/休眠自动暂停；
- 原始时间戳只在内存中保留最近十几秒用于天气，不落盘。

完整说明见 [PRIVACY.md](PRIVACY.md)。输入密码、银行信息等敏感内容前，请按 `Ctrl+Alt+Space` 暂停，或从托盘退出。

## 技术结构

```text
KeygardenKeys.exe (C#)
  │  只发送 category + timestamp
  ▼
Electron main process
  ├─ KeyObserver       管理观察器进程、掉线重启、暂停
  ├─ GameEngine        节奏分类、植物成长、日切、明信片
  ├─ StateStore        本地 JSON 原子写入
  ├─ Overlay window    透明桌面层、鼠标穿透、5 阶段照片生长
  └─ Journal window    手帐 / 明信片 / 模式选择 / 设置
```

主要目录：

```text
src/
  main/
    main.js           Electron 主进程与窗口、托盘、快捷键、IPC
    observer.js       全局观察器子进程管理
    engine.js         游戏状态、成长与每日结算
    journey.js        B 模式路线、路程、扎营与旅行明信片
    store.js          本地存档
    demo.js           仅演示/截图使用的演示状态
  input/
    KeygardenKeys.cs  全局键类观察器源码
  preload/            contextBridge API
  renderer/
    overlay/          角落花园 UI + 5 阶段照片生长
    journey/          B 模式底部旅行风景带
    journal/          花园手帐 UI
  shared/
    modes.js          A / B / C 三种游戏模式元数据
    rhythm.js         节奏分类、物种、明信片文本
resources/
  KeygardenKeys.exe   已编译的观察器（x64）
  icon.png / icon.ico
tests/
concepts/             早期 A/B/C 概念图
docs/screenshots/     README 截图
```

### 为什么用单独的观察器进程

Electron 主进程直接装全局键盘钩子，在部分受限的 Windows 环境里不稳定。这里用独立的 C# 子进程读取键状态，并通过标准输出发送**键类**，主进程完全接触不到按键代码。副作用是隐私边界更清楚，暂停时也能直接结束这个进程。

## 测试

```powershell
npm test
```

当前覆盖：

- 节奏分类（晨间、夜间、持续、阵风、安静）
- 键类到植物的映射
- 日切、成长、新植物、明信片
- 明信片已读状态
- 9 株植物上限与归档
- 无输入日不生成明信片
- 跨多日未打开时的天数计算
- 旧存档归一化

## 已知限制

- **仅 Windows x64**，观察器和打包方式都针对 Windows；
- **未签名**：首次运行或安装时 Windows/杀毒软件可能提示；
- 全局观察器**无法识别密码框**，敏感输入请手动暂停；
- 以管理员权限运行的窗口可能不在观察范围内；
- B 模式是 MVP：风景带、路程、扎营与旅行明信片已跑通，独立旅行手帐页和纪念品选择还未完成；
- C 模式目前只有入口和概念，没有实现；
- 这是一个早期的桌面原型，存档结构以后可能迁移。

### 在受限开发环境里运行

如果项目目录本身带有 Windows 的低完整性标签（例如某些自动化代理的 workspace），那么从该目录直接启动的进程可能无法读取全局键盘输入。此时：

```powershell
npm run package
npm run install:local
```

安装到 `%LOCALAPPDATA%\Programs\Keygarden` 再启动，就能在正常的用户完整性下运行。应用的键盘采集已在安装后的打包版本中验证：输入一组字母、数字、标点、空格和回车后，手帐正确记录了对应的类别计数。

## 路线图

- [x] A 模式最小可玩版本
- [x] 全局键类观察 + 隐私边界
- [x] 每日明信片与植物图鉴
- [x] B/C 模式选择器
- [x] B 模式 MVP：底部旅行风景带、路程、扎营与旅行明信片
- [ ] 手帐内的“今晚浇一次水 / 选一颗明日种子”
- [ ] B 模式：独立旅行手帐页与纪念品三选一
- [ ] C 模式：等距小镇与每日蓝图
- [ ] 自动更新与签名安装包
- [ ] 更多物种变种与年度花园册

## 仓库

<https://github.com/Auoh/keygarden>

当前未选择开源许可证；如要公开发布，请先补上 LICENSE。
