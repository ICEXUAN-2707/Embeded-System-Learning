(function () {
  "use strict";

  var jiangxieCourse = "https://www.bilibili.com/video/BV1th411z7sn/";
  var electronicsCourse = "https://higher.smartedu.cn/course/62354d5e9906eace049019f4";

  window.CURRICULUM = {
    schemaVersion: 1,
    stages: [
      { id: "foundation", title: "阶段 1 · 系统与电路基础", order: 10 },
      { id: "interaction", title: "阶段 2 · 显示、输入与事件", order: 20 },
      { id: "timing", title: "阶段 3 · 时间、波形与运动", order: 30 },
      { id: "data", title: "阶段 4 · 模拟量与数据搬运", order: 40 },
      { id: "communication", title: "阶段 5 · 通信、存储与可靠性", order: 50 },
      { id: "project", title: "阶段 6 · 综合作品", order: 60 }
    ],
    modules: [
      { id: "orientation", stageId: "foundation", title: "路线与基础", order: 10 },
      { id: "gpio", stageId: "foundation", title: "GPIO 输入输出闭环", order: 20 },
      { id: "display", stageId: "interaction", title: "显示与调试", order: 30 },
      { id: "events", stageId: "interaction", title: "输入、中断与事件", order: 40 },
      { id: "timers", stageId: "timing", title: "定时器与 PWM", order: 50 },
      { id: "motion", stageId: "timing", title: "运动执行", order: 60 },
      { id: "analog", stageId: "data", title: "ADC 与环境感知", order: 70 },
      { id: "transfer", stageId: "data", title: "DMA 数据搬运", order: 80 },
      { id: "serial", stageId: "communication", title: "USART 与数据包", order: 90 },
      { id: "buses", stageId: "communication", title: "I²C、SPI 与外部器件", order: 100 },
      { id: "reliability", stageId: "communication", title: "存储与可靠性", order: 110 },
      { id: "integrated", stageId: "project", title: "桌面环境互动助手", order: 120 }
    ],
    nodes: [
      {
        id: "route-overview",
        stageId: "foundation",
        moduleId: "orientation",
        title: "路线说明",
        type: "theory",
        importance: "core",
        order: 10,
        objective: "知道两次学习循环各自解决什么问题，并能描述 STM32 学习的输入—处理—输出主线。",
        prerequisites: [],
        resources: [
          {
            id: "jiangxie-intro",
            title: "江协科技《STM32 入门教程—2023版》",
            url: jiangxieCourse,
            scope: "[1-1] 课程简介、[1-2] STM32 简介",
            focus: {
              preview: "认识课程结构、STM32 的角色和第一循环的学习目标。",
              practice: "回看开发板、工具和实验路线，确认实操循环的准备条件。"
            },
            stopStandard: {
              preview: "能用自己的话说出第一循环与第二循环的区别。",
              practice: "能列出一次真实实验需要的接线、下载、观察和排错步骤。"
            },
            primary: true
          }
        ],
        loops: {
          preview: {
            tasks: [
              { id: "route-p-task-1", label: "浏览课程简介和 STM32 简介对应部分", required: true },
              { id: "route-p-task-2", label: "写下一句话：第一循环要获得什么成果", required: true }
            ],
            selfChecks: [
              { id: "route-p-check-1", label: "我能解释第一循环为什么不要求独立写完整驱动", core: true },
              { id: "route-p-check-2", label: "我能说出第二循环至少包含接线、下载、观察和排错", core: true }
            ]
          },
          practice: {
            tasks: [
              { id: "route-x-task-1", label: "确认开发板、下载器和课程资料是否已经具备", required: true },
              { id: "route-x-task-2", label: "写下本轮实操的安全原则和停止条件", required: true }
            ],
            selfChecks: [
              { id: "route-x-check-1", label: "我能区分编译、下载和程序运行三个阶段", core: true },
              { id: "route-x-check-2", label: "我知道复杂接线应断电修改", core: true }
            ]
          }
        }
      },
      {
        id: "voltage-level",
        stageId: "foundation",
        moduleId: "orientation",
        title: "电压与电平基础",
        type: "theory",
        importance: "core",
        order: 20,
        objective: "理解电压、电流、回路和高低电平，为安全连接 GPIO 与外部器件打基础。",
        prerequisites: ["route-overview"],
        resources: [
          {
            id: "smartedu-circuit",
            title: "国家高等教育智慧教育平台《电工电子技术》",
            url: electronicsCourse,
            scope: "1.1 电路组成及基本电参数；按需要查看 1.2、1.3",
            focus: {
              preview: "区分电压、电流、电阻、电源和负载；理解高低电平对应电压范围。",
              practice: "关注 3.3V、GND、限流电阻、极性和简单回路。"
            },
            stopStandard: {
              preview: "能解释高低电平不是两个抽象文字，而是电压范围。",
              practice: "能在断电状态下检查 LED 回路，并说明限流电阻的作用。"
            },
            primary: true
          }
        ],
        loops: {
          preview: {
            tasks: [
              { id: "voltage-p-task-1", label: "学习 1.1 中电压、电流、电阻、电源和负载", required: true },
              { id: "voltage-p-task-2", label: "画出一个包含电源、负载和回路的简单示意", required: true }
            ],
            selfChecks: [
              { id: "voltage-p-check-1", label: "我能区分电压和电流", core: true },
              { id: "voltage-p-check-2", label: "我能解释为什么 LED 通常需要限流电阻", core: true },
              { id: "voltage-p-check-3", label: "我知道高低电平代表电压范围", core: true }
            ]
          },
          practice: {
            tasks: [
              { id: "voltage-x-task-1", label: "识别开发板上的 3.3V 与 GND", required: true },
              { id: "voltage-x-task-2", label: "断电检查 LED 极性和限流路径", required: true }
            ],
            selfChecks: [
              { id: "voltage-x-check-1", label: "我能说明共地为什么重要", core: true },
              { id: "voltage-x-check-2", label: "我不会带电改变复杂接线", core: true }
            ]
          }
        }
      },
      {
        id: "c-bitwise",
        stageId: "foundation",
        moduleId: "orientation",
        title: "C 语言位运算",
        type: "theory",
        importance: "core",
        order: 30,
        objective: "理解按位与、或、异或、取反和移位如何检查或修改一个整数中的特定位。",
        prerequisites: ["route-overview"],
        resources: [
          {
            id: "runoob-bitwise",
            title: "菜鸟教程：C 运算符",
            url: "https://www.runoob.com/cprogramming/c-operators.html",
            scope: "只看“位运算符”部分",
            focus: {
              preview: "理解 &、|、^、~、<<、>> 的逐位运算结果。",
              practice: "把位掩码与 GPIO 配置或状态位联系起来。"
            },
            stopStandard: {
              preview: "给出两个简单二进制数时，能手算按位与、或和移位。",
              practice: "能用掩码解释设置、清除和读取某一位，不要求背复杂表达式。"
            },
            primary: true
          },
          {
            id: "csdn-bitwise",
            title: "CSDN：C语言位运算符详解与高效编程应用",
            url: "https://blog.csdn.net/weixin_45891612/article/details/128010942",
            scope: "位运算符表、指定位置位和掩码示例",
            focus: {
              preview: "用示例巩固二进制逐位计算。",
              practice: "关注取位、置位和清位的常见写法。"
            },
            stopStandard: {
              preview: "能解释按位运算与逻辑运算不是一回事。",
              practice: "能指出一个简单掩码操作影响了哪些位。"
            },
            primary: false
          }
        ],
        loops: {
          preview: {
            tasks: [
              { id: "bit-p-task-1", label: "阅读菜鸟教程的位运算符部分", required: true },
              { id: "bit-p-task-2", label: "手算一组按位与、按位或和左移", required: true }
            ],
            selfChecks: [
              { id: "bit-p-check-1", label: "我能区分 & 与 &&", core: true },
              { id: "bit-p-check-2", label: "我能解释 1 << n 如何得到一个掩码", core: true }
            ]
          },
          practice: {
            tasks: [
              { id: "bit-x-task-1", label: "在 GPIO 示例代码中找到一次位操作或位掩码", required: true },
              { id: "bit-x-task-2", label: "用自己的话标注该操作读取或改变了哪些位", required: true }
            ],
            selfChecks: [
              { id: "bit-x-check-1", label: "我能用掩码检查一个状态位", core: true },
              { id: "bit-x-check-2", label: "我能说明置位与清位的区别", core: true }
            ]
          }
        }
      },
      {
        id: "gpio-theory",
        stageId: "foundation",
        moduleId: "gpio",
        title: "GPIO 理论",
        type: "theory",
        importance: "core",
        order: 40,
        objective: "理解程序、GPIO 外设、引脚和外部器件之间的控制关系。",
        prerequisites: ["voltage-level", "c-bitwise"],
        resources: [
          {
            id: "jiangxie-gpio-theory",
            title: "江协科技《STM32 入门教程—2023版》",
            url: jiangxieCourse,
            scope: "[3-1] GPIO 输出",
            focus: {
              preview: "追踪程序、GPIO 外设、引脚和 LED 的关系，不背库函数。",
              practice: "关注输出模式、引脚配置和输出电平如何影响真实电路。"
            },
            stopStandard: {
              preview: "能画出“程序→GPIO→引脚→LED”的控制链。",
              practice: "能在示例工程中找到 GPIO 初始化和输出控制位置。"
            },
            primary: true
          }
        ],
        loops: {
          preview: {
            tasks: [
              { id: "gpio-p-task-1", label: "观看 [3-1]，只追踪输入—程序—输出关系", required: true },
              { id: "gpio-p-task-2", label: "画出程序到 LED 的 GPIO 控制链", required: true }
            ],
            selfChecks: [
              { id: "gpio-p-check-1", label: "我能区分 GPIO 外设和物理引脚", core: true },
              { id: "gpio-p-check-2", label: "我能解释输出高低电平如何影响 LED", core: true }
            ]
          },
          practice: {
            tasks: [
              { id: "gpio-x-task-1", label: "在示例工程中找到 GPIO 初始化位置", required: true },
              { id: "gpio-x-task-2", label: "找到改变输出电平的代码位置", required: true }
            ],
            selfChecks: [
              { id: "gpio-x-check-1", label: "我能说明初始化与输出控制分别负责什么", core: true },
              { id: "gpio-x-check-2", label: "我能根据原理图确认目标引脚", core: true }
            ]
          }
        }
      },
      {
        id: "led-gpio-experiment",
        stageId: "foundation",
        moduleId: "gpio",
        title: "LED / GPIO 实验",
        type: "experiment",
        importance: "core",
        order: 50,
        objective: "把 GPIO 控制链落实为可观察的 LED 现象，并能完成一次简单变式。",
        prerequisites: ["gpio-theory"],
        resources: [
          {
            id: "jiangxie-led-experiment",
            title: "江协科技《STM32 入门教程—2023版》",
            url: jiangxieCourse,
            scope: "[3-2] LED 闪烁、流水灯、蜂鸣器",
            focus: {
              preview: "观察代码变化与 LED 现象的对应关系。",
              practice: "完成接线、下载、观察，并修改闪烁速度。"
            },
            stopStandard: {
              preview: "能预测改变延时时间后 LED 闪烁速度如何变化。",
              practice: "LED 能稳定闪烁，且能独立修改速度并说明修改位置。"
            },
            primary: true
          }
        ],
        loops: {
          preview: {
            tasks: [
              { id: "led-p-task-1", label: "观看 [3-2] 中 LED 闪烁实验", required: true },
              { id: "led-p-task-2", label: "写下改变延时时间对现象的预测", required: true }
            ],
            selfChecks: [
              { id: "led-p-check-1", label: "我能追踪初始化、主循环和 GPIO 输出调用", core: true },
              { id: "led-p-check-2", label: "我能解释 LED 为什么会周期闪烁", core: true }
            ]
          },
          practice: {
            tasks: [
              { id: "led-x-task-1", label: "接线并成功下载 LED 闪烁示例", required: true },
              { id: "led-x-task-2", label: "修改参数，让闪烁速度明显变化", required: true },
              { id: "led-x-task-3", label: "按供电→接线→引脚→初始化→逻辑检查一次", required: true }
            ],
            selfChecks: [
              { id: "led-x-check-1", label: "我能解释每根关键连接线的目的", core: true },
              { id: "led-x-check-2", label: "我能指出控制 LED 的代码路径", core: true },
              { id: "led-x-check-3", label: "出现无反应时，我能按固定顺序排查", core: true }
            ]
          }
        }
      }
    ]
  };

  function courseResource(id, scope, previewFocus, practiceFocus, previewStop, practiceStop) {
    return {
      id: id,
      title: "江协科技《STM32 入门教程—2023版》",
      url: jiangxieCourse,
      scope: scope,
      focus: { preview: previewFocus, practice: practiceFocus },
      stopStandard: { preview: previewStop, practice: practiceStop },
      primary: true
    };
  }

  function itemList(prefix, labels, flagName) {
    return labels.map(function (label, index) {
      var item = { id: prefix + "-" + (index + 1), label: label };
      item[flagName] = true;
      return item;
    });
  }

  function routeNode(config) {
    return {
      id: config.id,
      stageId: config.stageId,
      moduleId: config.moduleId,
      title: config.title,
      type: config.type || "theory",
      importance: config.importance || "core",
      order: config.order,
      objective: config.objective,
      prerequisites: config.prerequisites || [],
      resources: config.resources || [],
      loops: {
        preview: {
          tasks: itemList(config.id + "-p-task", config.previewTasks, "required"),
          selfChecks: itemList(config.id + "-p-check", config.previewChecks, "core")
        },
        practice: {
          tasks: itemList(config.id + "-x-task", config.practiceTasks, "required"),
          selfChecks: itemList(config.id + "-x-check", config.practiceChecks, "core")
        }
      }
    };
  }

  var moreNodes = [
    routeNode({
      id: "digital-logic", stageId: "foundation", moduleId: "orientation", title: "数字逻辑与真值表",
      importance: "optional", order: 25, objective: "认识二进制、高低电平、与或非异或和简单真值表。",
      prerequisites: ["voltage-level"],
      resources: [{
        id: "smartedu-digital-logic",
        title: "国家高等教育智慧教育平台《电工电子技术》",
        url: electronicsCourse,
        scope: "4.1 数字逻辑电路基础",
        focus: { preview: "理解逻辑运算与高低电平的对应。", practice: "用真值表预测简单输入输出组合。" },
        stopStandard: { preview: "能读懂简单与、或、非真值表。", practice: "能根据输入组合预测输出，不要求复杂化简。" },
        primary: true
      }],
      previewTasks: ["学习 4.1 中二进制与基本逻辑门", "完成一张简单真值表"],
      previewChecks: ["能区分逻辑与和按位与", "能根据输入预测与、或、非输出"],
      practiceTasks: ["用两个输入状态设计一个简单条件判断"],
      practiceChecks: ["能用真值表检查程序条件"]
    }),
    routeNode({
      id: "c-data-memory", stageId: "foundation", moduleId: "orientation", title: "嵌入式 C 数据与指针",
      importance: "optional", order: 35, objective: "补齐数组、字符串、指针、结构体和枚举在外设数据处理中的基本用途。",
      prerequisites: ["c-bitwise"],
      resources: [{
        id: "jiangxie-c-tutorial",
        title: "江协科技编程技巧与 C 语言指针教程",
        url: "https://jiangxiekeji.com/tutorial.html",
        scope: "C语言指针教程；按需复习数组、字符串、结构体和枚举",
        focus: { preview: "画清变量—地址—指针关系，不背复杂声明。", practice: "在 OLED、串口和数组数据中重看对应部分。" },
        stopStandard: { preview: "能解释指针保存地址以及数组元素的连续关系。", practice: "能追踪一个缓冲区如何在函数间传递。" },
        primary: true
      }],
      previewTasks: ["画出变量—地址—指针关系", "复习数组、字符串、结构体与枚举的用途"],
      previewChecks: ["能解释指针保存的是什么", "能区分字符、字符串与字节数组"],
      practiceTasks: ["在 OLED 或串口示例中追踪一个数组或指针", "标出数据从创建到使用的路径"],
      practiceChecks: ["能说明缓冲区如何传给函数", "能避免把地址和值混为一谈"]
    }),
    routeNode({
      id: "gpio-input", stageId: "foundation", moduleId: "gpio", title: "GPIO 输入与按键",
      order: 60, objective: "理解输入模式、默认电平和程序读取之间的关系。",
      prerequisites: ["gpio-theory"],
      resources: [courseResource("jiangxie-gpio-input", "[3-3] GPIO输入、[3-4] 按键控制LED与光敏模块",
        "区分输入和输出，关注上拉、下拉与默认电平。", "完成按键读取并按供电、接线、引脚和逻辑排查。",
        "能画出按键→GPIO输入→程序判断→输出的链路。", "按键能稳定控制输出，并能解释异常输入原因。")],
      previewTasks: ["观看 [3-3]，整理输入模式与默认电平", "画出按键输入控制链"],
      previewChecks: ["能解释输入悬空可能造成什么现象", "能区分输入读取与输出控制"],
      practiceTasks: ["完成按键控制 LED", "将按住点亮改为按一次切换一次"],
      practiceChecks: ["能找到输入读取和状态判断位置", "能按固定顺序排查无反应"]
    }),
    routeNode({
      id: "oled-display", stageId: "interaction", moduleId: "display", title: "OLED 显示与调试",
      order: 70, objective: "理解变量如何经过驱动变成屏幕上的文字或图形。",
      prerequisites: ["gpio-input"],
      resources: [courseResource("jiangxie-oled", "[4-1] OLED调试工具、[4-2] OLED显示屏",
        "把 OLED 看作信息输出设备，追踪变量到像素的路径。", "显示按键次数或当前模式，关注初始化与刷新位置。",
        "能解释数字如何从变量变成屏幕内容。", "能修改显示内容并确认刷新正常。")],
      previewTasks: ["观看 [4-1]、[4-2] 的原理与演示", "制作 OLED 输入—处理—输出卡片"],
      previewChecks: ["能说明 OLED 解决什么问题", "能解释变量到屏幕内容的路径"],
      practiceTasks: ["让 OLED 显示一个变量", "修改显示位置或文本"],
      practiceChecks: ["能找到初始化与刷新调用", "能区分数据变化和屏幕刷新"]
    }),
    routeNode({
      id: "exti-interrupt", stageId: "interaction", moduleId: "events", title: "EXTI 外部中断",
      order: 80, objective: "理解事件到来时 CPU 如何暂停当前工作并执行短小处理。",
      prerequisites: ["gpio-input"],
      resources: [courseResource("jiangxie-exti", "[5-1] EXTI外部中断",
        "比较轮询与中断，理解上升沿、下降沿和短中断函数。", "完成外部中断计次，让复杂显示回到主循环。",
        "能解释进入中断、执行和返回三个时刻。", "中断可稳定计次，且中断函数中没有长延时。")],
      previewTasks: ["观看 [5-1]，比较轮询与中断", "画出一次中断事件时间线"],
      previewChecks: ["能解释为什么中断函数应尽量短", "能区分上升沿和下降沿"],
      practiceTasks: ["完成外部中断计次", "把显示处理放回主循环"],
      practiceChecks: ["能解释中断前、进入和退出三个时刻", "能说明事件记录与业务处理的区别"]
    }),
    routeNode({
      id: "rotary-encoder", stageId: "interaction", moduleId: "events", title: "旋转编码器计次",
      type: "experiment", order: 90, objective: "把机械旋转转换为可计数事件并安全更新程序状态。",
      prerequisites: ["exti-interrupt", "oled-display"],
      resources: [courseResource("jiangxie-encoder", "[5-2] 红外传感器计次、旋转编码器计次",
        "关注机械动作如何变成程序事件。", "设置上下限并观察快速旋转时是否漏计。",
        "能解释编码器如何产生方向和计数信息。", "能稳定调节数值并处理越界。")],
      previewTasks: ["观看 [5-2] 中编码器部分", "画出旋转→电平变化→中断→计数链路"],
      previewChecks: ["能解释机械旋转如何变成事件", "能说明计数变量为何要保留"],
      practiceTasks: ["用编码器调节一个数值并显示", "加入数值上下限"],
      practiceChecks: ["能处理计数越界", "能观察并解释快速旋转漏计"]
    }),
    routeNode({
      id: "timer-interrupt", stageId: "timing", moduleId: "timers", title: "定时器与周期事件",
      order: 100, objective: "理解硬件计数如何产生稳定周期事件，而不是阻塞 CPU 等待。",
      prerequisites: ["exti-interrupt"],
      resources: [courseResource("jiangxie-timer", "[6-1] TIM定时中断、[6-2] 定时器定时中断与外部时钟",
        "理解系统时钟、计数、周期事件和普通 Delay 的区别。", "配置周期事件并解释主要参数。",
        "能画出系统时钟→计数→事件的路径。", "能根据目标周期解释参数，并观察周期变化。")],
      previewTasks: ["观看 [6-1]、[6-2] 原理部分", "画出系统时钟到周期事件的链路"],
      previewChecks: ["能解释 Delay 与定时器的区别", "能说明频率与周期的关系"],
      practiceTasks: ["完成定时器周期事件", "修改参数并比较周期"],
      practiceChecks: ["能根据目标周期解释参数", "能定位周期明显错误的原因"]
    }),
    routeNode({
      id: "pwm-output", stageId: "timing", moduleId: "timers", title: "PWM 输出与呼吸灯",
      order: 110, objective: "理解快速开关、频率和占空比如何形成可调平均效果。",
      prerequisites: ["timer-interrupt"],
      resources: [courseResource("jiangxie-pwm", "[6-3] TIM输出比较、[6-4] PWM驱动呼吸灯",
        "理解频率、周期、比较事件和占空比。", "完成呼吸灯并分别修改频率和占空比。",
        "能解释 50% 占空比以及呼吸灯视觉效果。", "能预测参数变化并让亮度平滑改变。")],
      previewTasks: ["观看 [6-3]、[6-4] 的 PWM 部分", "制作周期与占空比卡片"],
      previewChecks: ["能解释 50% 占空比", "能区分改变频率和占空比"],
      practiceTasks: ["完成 PWM 呼吸灯", "分别修改频率和占空比观察差异"],
      practiceChecks: ["能预测参数变化的影响", "能解释 GPIO 实际仍在高低电平间切换"]
    }),
    routeNode({
      id: "servo-control", stageId: "timing", moduleId: "motion", title: "舵机控制",
      type: "experiment", order: 120, objective: "用指定周期的 PWM 脉冲控制舵机，并关注供电与共地。",
      prerequisites: ["pwm-output"],
      resources: [courseResource("jiangxie-servo", "[6-4] PWM驱动舵机",
        "理解舵机控制脉冲与供电要求。", "用编码器调节角度并检查供电稳定性。",
        "能说明舵机为何需要特定周期脉冲。", "舵机可调角度且系统不因供电问题反复复位。")],
      previewTasks: ["观看 [6-4] 舵机部分", "画出 PWM→舵机动作链路"],
      previewChecks: ["能说明舵机控制关注周期与脉宽", "能解释为什么必须共地"],
      practiceTasks: ["完成舵机角度控制", "用编码器调节角度"],
      practiceChecks: ["能预测角度参数变化", "系统不会因供电问题反复复位"]
    }),
    routeNode({
      id: "dc-motor", stageId: "timing", moduleId: "motion", title: "直流电机与驱动",
      type: "experiment", importance: "optional", order: 130,
      objective: "理解 GPIO 不能直接承担电机工作电流，驱动与供电条件必须明确。",
      prerequisites: ["pwm-output", "voltage-level"],
      resources: [courseResource("jiangxie-motor", "[6-4] PWM驱动直流电机",
        "关注三极管或驱动模块、电机供电与保护。", "仅在驱动模块和供电明确时完成调速。",
        "能解释为什么不能由 GPIO 直接提供电机全部电流。", "电机调速稳定且控制器不复位。")],
      previewTasks: ["观看 [6-4] 电机部分并标记供电链路"],
      previewChecks: ["能解释驱动模块的作用", "知道反向电动势需要保护"],
      practiceTasks: ["确认驱动与独立供电条件", "完成安全的 PWM 调速"],
      practiceChecks: ["能解释每条供电与控制连接", "电机动作时系统保持稳定"]
    }),
    routeNode({
      id: "adc-basics", stageId: "data", moduleId: "analog", title: "ADC 模数转换",
      order: 140, objective: "理解连续电压如何转换为有限范围的数字值。",
      prerequisites: ["voltage-level", "timer-interrupt"],
      resources: [courseResource("jiangxie-adc", "[7-1] ADC模数转换器、[7-2] AD单通道与多通道",
        "理解参考电压、分辨率和 0～4095 数字范围。", "读取光敏或电位器，并显示原始值。",
        "能解释 12 位 ADC 为什么通常得到 0～4095。", "能读取并把原始值映射为百分比或等级。")],
      previewTasks: ["观看 [7-1]、[7-2] 原理部分", "画出模拟电压→ADC→数字值链路"],
      previewChecks: ["能解释参考电压和分辨率", "能说明原始值为什么可能波动"],
      practiceTasks: ["读取一个模拟量并显示原始值", "将数值映射为百分比或等级"],
      practiceChecks: ["能解释读数波动", "不会把读数当作绝对准确物理量"]
    }),
    routeNode({
      id: "adc-control", stageId: "data", moduleId: "analog", title: "环境阈值与滞回控制",
      type: "experiment", order: 150, objective: "根据环境读数控制输出，并用平均与双阈值减少抖动。",
      prerequisites: ["adc-basics", "pwm-output"],
      resources: [courseResource("jiangxie-adc-control", "[7-2] AD单通道与多通道；结合 PWM 章节",
        "追踪光照→电压→数字值→判断→输出。", "加入多次平均和双阈值滞回。",
        "能画出完整环境控制数据链。", "临界点附近输出不会频繁跳变。")],
      previewTasks: ["画出光照到输出的完整数据链", "比较单阈值与双阈值"],
      previewChecks: ["能解释阈值判断的作用", "能说明双阈值为何减少抖动"],
      practiceTasks: ["用 ADC 值控制 LED 或舵机", "加入采样平均和双阈值"],
      practiceChecks: ["能解释平均与滞回的区别", "输出在临界点附近保持稳定"]
    }),
    routeNode({
      id: "dma-transfer", stageId: "data", moduleId: "transfer", title: "DMA 数据搬运",
      importance: "optional", order: 160, objective: "理解 DMA 如何减少 CPU 亲自搬运连续数据的工作。",
      prerequisites: ["adc-basics"],
      resources: [courseResource("jiangxie-dma", "[8-1] DMA直接存储器存取、[8-2] DMA数据转运与多通道AD",
        "把 DMA 理解为数据搬运者，快速浏览多通道示例。", "观察 DMA 搬运数组或 ADC 多通道数据。",
        "能解释 DMA 与传感器、CPU 的角色区别。", "能指出数据来源、目标和搬运触发条件。")],
      previewTasks: ["观看 [8-1]，快速浏览 [8-2]", "画出外设→DMA→内存路径"],
      previewChecks: ["能解释 DMA 如何减轻 CPU 工作", "知道 DMA 不是新的传感器"],
      practiceTasks: ["运行一个 DMA 搬运示例", "找到源地址、目标地址和数量"],
      practiceChecks: ["能追踪一次搬运", "能说明 DMA 完成后 CPU 如何使用数据"]
    }),
    routeNode({
      id: "usart-protocol", stageId: "communication", moduleId: "serial", title: "USART 串口协议",
      order: 170, objective: "理解发送、接收、波特率和共地构成的串行通信基础。",
      prerequisites: ["gpio-input", "c-bitwise"],
      resources: [courseResource("jiangxie-usart", "[9-1] USART串口协议、[9-2] USART串口外设",
        "关注 TX、RX、波特率和共地，外设配置快速浏览。", "让 STM32 与电脑互发数据并识别波特率错误。",
        "能画出 STM32 与电脑之间的数据路径。", "能稳定收发并识别乱码的常见原因。")],
      previewTasks: ["观看 [9-1]，快速浏览 [9-2]", "画出 STM32→USB串口→电脑链路"],
      previewChecks: ["能解释 TX、RX 与共地", "能说明波特率不一致为何乱码"],
      practiceTasks: ["让 STM32 向电脑发送数据", "从电脑发送一个控制命令"],
      practiceChecks: ["能区分发送与接收路径", "能定位波特率或接线问题"]
    }),
    routeNode({
      id: "serial-packets", stageId: "communication", moduleId: "serial", title: "串口数据包与文本协议",
      type: "experiment", order: 180, objective: "用起止标志、长度或换行划分消息边界，并安全处理未知命令。",
      prerequisites: ["usart-protocol"],
      resources: [courseResource("jiangxie-packets", "[9-4] USART串口数据包、[9-5] HEX与文本数据包",
        "理解字节、字符、字符串和消息边界。", "实现简单文本命令，未知或不完整命令不得误执行。",
        "能解释数据包为什么需要边界。", "双向通信可持续运行并安全处理错误输入。")],
      previewTasks: ["观看 [9-4]、[9-5]", "设计一条带边界的文本消息"],
      previewChecks: ["能区分字节、字符和字符串", "能解释起止标志或长度的作用"],
      practiceTasks: ["实现一条查询和一条控制命令", "处理未知与不完整命令"],
      practiceChecks: ["错误命令不会被执行", "能画出双向数据流"]
    }),
    routeNode({
      id: "i2c-protocol", stageId: "communication", moduleId: "buses", title: "I²C 协议与设备地址",
      order: 190, objective: "理解两线总线、设备地址、寄存器地址和数据之间的关系。",
      prerequisites: ["serial-packets"],
      resources: [courseResource("jiangxie-i2c", "[10-1] I²C通信协议、[10-2] MPU6050简介",
        "关注总线线路、设备地址与一次读写流程。", "连接课程配套设备并按流程读取寄存器。",
        "能区分设备地址、寄存器地址和数据。", "通信失败时会检查供电、共地、引脚、地址和时序。")],
      previewTasks: ["观看 [10-1]、[10-2]", "画出主机、地址、寄存器与数据关系"],
      previewChecks: ["能说明 I²C 为什么可连接多个设备", "能区分设备地址与寄存器地址"],
      practiceTasks: ["扫描或确认一个 I²C 设备地址", "读取一个寄存器并显示结果"],
      practiceChecks: ["能追踪一次读操作", "能按固定顺序排查通信失败"]
    }),
    routeNode({
      id: "mpu6050-read", stageId: "communication", moduleId: "buses", title: "MPU6050 读取实验",
      type: "experiment", order: 200, objective: "按 I²C 流程读取传感器寄存器并解释数据来源。",
      prerequisites: ["i2c-protocol"],
      resources: [courseResource("jiangxie-mpu6050", "[10-3] 软件I²C读写MPU6050",
        "重点看读写流程，代码只追踪关键路径。", "读取传感器数据并改变显示或输出。",
        "能根据流程图追踪一次读写。", "能稳定读取数据并定位地址或接线错误。")],
      previewTasks: ["观看 [10-3] 的通信流程", "标记设备地址、寄存器地址和数据"],
      previewChecks: ["能根据图追踪一次读写", "不要求默写完整软件时序"],
      practiceTasks: ["读取 MPU6050 或课程配套 I²C 设备", "显示至少一项数据"],
      practiceChecks: ["能解释数据来自哪个寄存器", "能定位常见通信失败原因"]
    }),
    routeNode({
      id: "spi-protocol", stageId: "communication", moduleId: "buses", title: "SPI 协议与片选",
      order: 210, objective: "理解时钟、收发数据线和片选如何组织高速同步通信。",
      prerequisites: ["i2c-protocol"],
      resources: [courseResource("jiangxie-spi", "[11-1] SPI通信协议、[11-2] W25Q64简介",
        "比较 SPI 与 I²C，关注片选和全双工线路。", "观察一次 SPI 读写并确认目标器件。",
        "能说明片选信号的作用。", "能根据图追踪一次收发并检查时序条件。")],
      previewTasks: ["观看 [11-1]、[11-2]", "制作 I²C 与 SPI 对比卡片"],
      previewChecks: ["能说明 SPI 片选的作用", "能比较 SPI 与 I²C 的线路和寻址"],
      practiceTasks: ["观察或运行一次 SPI 通信", "标记时钟、数据和片选引脚"],
      practiceChecks: ["能追踪一次收发", "能按供电、引脚、片选和时序排查"]
    }),
    routeNode({
      id: "w25q64-storage", stageId: "communication", moduleId: "buses", title: "W25Q64 外部存储",
      type: "experiment", importance: "optional", order: 220,
      objective: "通过 SPI 完成一次外部 Flash 数据写入与读回验证。",
      prerequisites: ["spi-protocol"],
      resources: [courseResource("jiangxie-w25q64", "[11-3] 软件SPI读写W25Q64",
        "重点看命令、地址和数据流程。", "写入一小段测试数据并读回比较。",
        "能解释命令、地址和数据的先后关系。", "读回值与写入值一致，并能解释失败检查顺序。")],
      previewTasks: ["观看 [11-3] 的读写流程", "画出命令→地址→数据链路"],
      previewChecks: ["能解释外部 Flash 的用途", "能区分设备选择与存储地址"],
      practiceTasks: ["写入一小段测试数据", "读回并比较结果"],
      practiceChecks: ["能解释读写流程", "能处理读回不一致的排查"]
    }),
    routeNode({
      id: "watchdog", stageId: "communication", moduleId: "reliability", title: "看门狗与失控恢复",
      importance: "optional", order: 230, objective: "理解看门狗如何发现程序长时间未正常运行并触发恢复。",
      prerequisites: ["timer-interrupt"],
      resources: [courseResource("jiangxie-watchdog", "[14-1] WDG看门狗",
        "理解喂狗、超时和复位的关系。", "制造可控超时并观察复位现象。",
        "能说明看门狗解决什么问题。", "能区分正常复位和看门狗超时复位。")],
      previewTasks: ["观看 [14-1] 原理部分", "画出正常运行与超时两条路径"],
      previewChecks: ["能解释看门狗为何不能修复所有错误", "能说明喂狗位置为何重要"],
      practiceTasks: ["运行一个看门狗示例", "制造可控超时并观察"],
      practiceChecks: ["能识别超时复位", "不会用无条件频繁喂狗掩盖失控"]
    }),
    routeNode({
      id: "internal-flash", stageId: "communication", moduleId: "reliability", title: "内部 Flash 持久化",
      importance: "optional", order: 240, objective: "理解断电保存、擦除和写入约束，不陷入全部代码细节。",
      prerequisites: ["c-bitwise"],
      resources: [courseResource("jiangxie-flash", "[15-1] FLASH闪存",
        "理解断电保存以及擦除后写入的基本约束。", "保存一个小配置并在重启后读回。",
        "能解释 Flash 与普通运行内存的区别。", "重启后能恢复配置，并避免无意义频繁写入。")],
      previewTasks: ["观看 [15-1] 的概念与流程", "列出 Flash 与运行内存的差异"],
      previewChecks: ["能解释断电后为何仍能保存", "知道写入前可能需要擦除"],
      practiceTasks: ["保存一个简单配置值", "重启并验证读回"],
      practiceChecks: ["能说明写入寿命风险", "能解释默认值与读回值的关系"]
    }),
    routeNode({
      id: "toolchain-safety", stageId: "project", moduleId: "integrated", title: "环境、下载与安全",
      type: "experiment", order: 250, objective: "建立从编译、下载到运行观察的可靠工具链与安全习惯。",
      prerequisites: ["route-overview", "voltage-level"],
      resources: [courseResource("jiangxie-toolchain", "[2-1] 软件安装、[2-2] 新建工程",
        "材料未到时只了解步骤，不让环境阻塞认知预习。", "安装课程工具，编译并下载现有工程。",
        "能区分编译、下载和运行三个阶段。", "能成功下载示例，并安全测量 3.3V 与 GND。")],
      previewTasks: ["快速浏览 [2-1]、[2-2]", "整理编译→下载→运行三个阶段"],
      previewChecks: ["能区分三个阶段的错误", "知道复杂接线应断电修改"],
      practiceTasks: ["安装课程要求的软件与驱动", "编译并下载一个现有工程"],
      practiceChecks: ["能成功下载到开发板", "能安全测量 3.3V 与 GND"]
    }),
    routeNode({
      id: "desktop-assistant", stageId: "project", moduleId: "integrated", title: "桌面环境互动助手",
      type: "experiment", order: 260, objective: "整合环境输入、用户输入、显示、执行器和串口，形成可解释的完整作品。",
      prerequisites: ["adc-control", "serial-packets", "rotary-encoder", "servo-control", "toolchain-safety"],
      resources: [{
        id: "route-project-brief",
        title: "本路线：桌面环境互动助手项目说明",
        url: jiangxieCourse,
        scope: "复用已学 GPIO、OLED、ADC、PWM、舵机与 USART 对应章节",
        focus: {
          preview: "画出传感—计算—通信—执行系统图并定义状态。",
          practice: "完成最小功能、错误输入保护和连续运行验证。"
        },
        stopStandard: {
          preview: "能解释完整输入、状态、通信与输出路径。",
          practice: "作品连续运行 30～60 分钟，并能说明三项重做改进。"
        },
        primary: true
      }],
      previewTasks: ["画出桌面互动助手系统图", "定义 IDLE、FOCUS、ALERT、MANUAL、ERROR 等状态"],
      previewChecks: ["能从传感—计算—通信—执行解释系统", "能列出仍不理解的具体问题"],
      practiceTasks: ["整合环境输入、用户输入、OLED、反馈、舵机和串口", "加入手动/自动模式与错误命令保护", "连续运行并记录故障"],
      practiceChecks: ["能展示完整数据路径", "错误命令下设备保持安全", "能说明至少三项重做改进"]
    })
  ];

  window.CURRICULUM.nodes = window.CURRICULUM.nodes.concat(moreNodes);
}());
