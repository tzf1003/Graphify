/**
 * AI 模型适配器统一导出
 */

// GeminiExtractor
export {
  GeminiExtractor,
  ExtractResult,
  GeminiExtractorFactory,
  createGeminiExtractor,
  GeminiExtractorFactoryConfig,
  MockGeminiExtractor,
  createMockGeminiExtractor,
  RealGeminiExtractor,
  RealGeminiExtractorConfig,
  createRealGeminiExtractor,
} from './gemini';

// NanoBananaEditor
export {
  NanoBananaEditor,
  GenerateOptions,
  GeneratedImage,
  NanoBananaEditorFactory,
  createNanoBananaEditor,
  NanoBananaEditorFactoryConfig,
  ImageProviderType,
  MockNanoBananaEditor,
  createMockNanoBananaEditor,
  RealNanoBananaEditor,
  RealNanoBananaEditorConfig,
  createRealNanoBananaEditor,
  OpenAINanoBananaEditor,
  OpenAINanoBananaConfig,
  createOpenAINanoBananaEditor,
} from './nanoBanana';

// TextToImageGenerator
export {
  TextToImageGenerator,
  TextToImageOptions,
  TextToImageResult,
  TextToImageProviderType,
  TextToImageGeneratorFactoryConfig,
  createTextToImageGenerator,
  MockTextToImageGenerator,
  createMockTextToImageGenerator,
  OpenAITextToImageGenerator,
  OpenAITextToImageConfig,
  createOpenAITextToImageGenerator,
} from './textToImage';
