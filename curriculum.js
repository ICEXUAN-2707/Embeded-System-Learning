(function () {
  "use strict";

  var jiangxieCourse = "https://www.bilibili.com/video/BV1th411z7sn/";
  var electronicsCourse = "https://higher.smartedu.cn/course/62354d5e9906eace049019f4";

  window.CURRICULUM = {
    schemaVersion: 1,
    stages: [
      { id: "foundation", title: "阶段 1 · 建立最小系统认知", order: 10 }
    ],
    modules: [
      { id: "orientation", stageId: "foundation", title: "路线与基础", order: 10 },
      { id: "gpio", stageId: "foundation", title: "GPIO 输入输出闭环", order: 20 }
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
}());
