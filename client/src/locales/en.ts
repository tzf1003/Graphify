export default {
  common: {
    appName: 'Image Editor',
    send: 'Send',
    cancel: 'Cancel',
    upload: 'Upload',
    loading: 'Loading...',
    error: 'Something went wrong',
    confirm: 'Confirm',
    delete: 'Delete',
    edit: 'Edit',
    save: 'Save',
    close: 'Close',
    retry: 'Retry',
    back: 'Back',
    home: 'Home',
    myProjects: 'My Projects',
    uploadImage: 'Upload Image',
    menu: 'Menu'
  },
  welcome: {
    title: 'Hello, I am your design assistant',
    subtitle: 'Upload an image or describe your idea, let me help you create designs'
  },
  chat: {
    placeholder: 'Describe the image you want to generate...',
    uploadHint: 'Or upload an image to start',
    generating: 'AI is generating your image...',
    analyzing: 'AI is analyzing the image...',
    sendMessage: 'Send message',
    clearHistory: 'Clear conversation',
    emptyState: 'Start a conversation with AI, describe your design'
  },
  hints: {
    upload: {
      title: 'Upload Image',
      desc: 'Upload a design image, AI will automatically parse it into editable JSON structure'
    },
    describe: {
      title: 'Describe Your Idea',
      desc: 'Describe the interface you want in words, AI will generate the design for you'
    },
    edit: {
      title: 'Edit JSON',
      desc: 'Directly edit the JSON structure to adjust design details'
    },
    regenerate: {
      title: 'Regenerate',
      desc: 'Not satisfied? Let AI generate another version'
    }
  },
  theme: {
    light: 'Light Mode',
    dark: 'Dark Mode',
    system: 'System',
    toggle: 'Toggle Theme'
  },
  language: {
    title: 'Language',
    zhCN: '简体中文',
    en: 'English'
  },
  project: {
    title: 'Project',
    create: 'Create Project',
    open: 'Open Project',
    delete: 'Delete Project',
    empty: 'No projects yet',
    list: 'Project List'
  },
  errors: {
    networkError: 'Network connection failed, please check and retry',
    timeout: 'Request timeout, please try again later',
    serverError: 'Server error, please try again later',
    invalidImage: 'Image format not supported, please upload PNG, JPG or WebP',
    fileTooLarge: 'File too large, please upload an image under 10MB',
    generationFailed: 'AI generation failed, please retry or modify your description',
    emptyInput: 'Please enter content',
    inputTooLong: 'Input content is too long'
  },
  inputMode: {
    text: 'Text Input',
    image: 'Image Upload',
    switchToText: 'Switch to text input',
    switchToImage: 'Switch to image upload'
  }
};
