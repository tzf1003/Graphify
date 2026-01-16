export default {
  common: {
    appName: '图析',
    send: '发送',
    cancel: '取消',
    upload: '上传',
    loading: '加载中...',
    error: '出错了',
    confirm: '确认',
    delete: '删除',
    edit: '编辑',
    save: '保存',
    close: '关闭',
    retry: '重试',
    back: '返回',
    home: '首页',
    myProjects: '我的项目',
    uploadImage: '上传图片',
    menu: '菜单'
  },
  welcome: {
    title: '图析，让设计一目了然',
    subtitle: '上传图片智能解析，或描述想法即刻生成，可视化设计从未如此简单'
  },
  chat: {
    placeholder: '描述你想要的设计，让图析为你呈现...',
    uploadHint: '拖拽或点击上传图片',
    generating: '图析正在为你生成设计...',
    analyzing: '图析正在解析图片结构...',
    sendMessage: '发送',
    clearHistory: '清空对话',
    emptyState: '告诉图析你的设计想法'
  },
  hints: {
    upload: {
      title: '智能解析',
      desc: '上传设计图，AI 自动识别元素与层级结构'
    },
    describe: {
      title: '文字生图',
      desc: '描述你的创意，AI 即刻生成专业设计'
    },
    edit: {
      title: '可视编辑',
      desc: '图形化编辑界面，所见即所得'
    },
    regenerate: {
      title: '一键重构',
      desc: '不满意？一键让 AI 重新生成'
    }
  },
  theme: {
    light: '浅色模式',
    dark: '暗色模式',
    system: '跟随系统',
    toggle: '切换主题'
  },
  language: {
    title: '语言',
    zhCN: '简体中文',
    en: 'English'
  },
  project: {
    title: '项目',
    create: '创建项目',
    open: '打开项目',
    delete: '删除项目',
    empty: '暂无项目',
    list: '项目列表'
  },
  errors: {
    networkError: '网络连接失败，请检查网络后重试',
    timeout: '请求超时，请稍后重试',
    serverError: '服务器错误，请稍后重试',
    invalidImage: '图片格式不支持，请上传 PNG、JPG 或 WebP 格式',
    fileTooLarge: '文件过大，请上传小于 10MB 的图片',
    generationFailed: 'AI 生成失败，请重试或修改描述',
    emptyInput: '请输入内容',
    inputTooLong: '输入内容过长'
  },
  inputMode: {
    text: '文字输入',
    image: '图片上传',
    switchToText: '切换到文字输入',
    switchToImage: '切换到图片上传'
  }
};
