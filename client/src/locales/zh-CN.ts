export default {
  common: {
    appName: '图片编辑器',
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
    title: '你好，我是你的设计助手',
    subtitle: '上传图片或描述你的想法，让我帮你创建设计'
  },
  chat: {
    placeholder: '描述你想要生成的图片...',
    uploadHint: '或上传一张图片开始',
    generating: 'AI 正在生成图片...',
    analyzing: 'AI 正在分析图片...',
    sendMessage: '发送消息',
    clearHistory: '清空对话',
    emptyState: '开始与 AI 对话，描述你想要的设计'
  },
  hints: {
    upload: {
      title: '上传图片',
      desc: '上传一张设计图，AI 将自动解析为可编辑的 JSON 结构'
    },
    describe: {
      title: '描述创意',
      desc: '用文字描述你想要的界面，AI 将为你生成设计'
    },
    edit: {
      title: '编辑 JSON',
      desc: '直接编辑 JSON 结构来调整设计细节'
    },
    regenerate: {
      title: '重新生成',
      desc: '不满意？让 AI 重新生成一个版本'
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
