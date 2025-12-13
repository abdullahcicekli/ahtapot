/**
 * File Extensions and TLD Collision Detection
 *
 * Bu dosya, dosya uzantıları ile TLD'lerin çakışmasını yönetir.
 * False positive'leri azaltmak için kullanılır.
 */

/**
 * Kesinlikle TLD OLMAYAN dosya uzantıları
 * Bu uzantılar her zaman dosya olarak kabul edilir, domain değil
 */
export const NON_TLD_EXTENSIONS = new Set([
  // Documents
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp',
  'rtf', 'txt', 'tex', 'wpd', 'wps',

  // Programming - NOT TLDs
  'js', 'ts', 'jsx', 'tsx', 'css', 'scss', 'sass', 'less',
  'html', 'htm', 'xhtml', 'php', 'asp', 'aspx', 'jsp',
  'c', 'cpp', 'h', 'hpp', 'cs', 'vb', 'go', 'rb', 'swift', 'kt', 'kts',
  'java', 'class', 'jar', 'war', 'ear',
  'lua', 'r', 'rmd', 'sql', 'psql', 'plsql',

  // Data formats
  'json', 'xml', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf', 'config',
  'csv', 'tsv', 'parquet', 'avro', 'orc',

  // Archives - NOT TLDs (except .zip which IS a TLD)
  'rar', 'tar', 'gz', 'bz2', 'xz', '7z', 'tgz', 'tbz2',

  // Executables
  'exe', 'msi', 'dll', 'sys', 'drv', 'ocx',
  'dmg', 'pkg', 'deb', 'rpm', 'apk', 'ipa',
  'bat', 'cmd', 'ps1', 'psm1', 'vbs', 'wsf',

  // Images - NOT TLDs
  'jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp', 'ico', 'svg',
  'psd', 'xcf', 'raw', 'cr2', 'nef', 'orf', 'sr2', 'heic', 'heif',

  // Audio - NOT TLDs
  'mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a', 'aiff', 'ape', 'opus',

  // Video - NOT TLDs (except .mov which IS a TLD)
  'mp4', 'avi', 'mkv', 'wmv', 'flv', 'webm', 'm4v', 'mpeg', 'mpg', '3gp',

  // Log and temp files
  'log', 'tmp', 'temp', 'bak', 'backup', 'old', 'orig', 'swp', 'swo',

  // Database
  'db', 'sqlite', 'sqlite3', 'mdb', 'accdb', 'dbf',

  // Misc
  'lock', 'pid', 'cache', 'dat', 'bin', 'img', 'iso', 'vhd', 'vmdk',
  'env', 'local', 'example', 'sample', 'dist', 'min',
]);

/**
 * TLD olan AMA aynı zamanda yaygın dosya uzantısı olan uzantılar
 * Risk seviyesine göre gruplandırılmış
 */
export const TLD_FILE_EXTENSION_COLLISIONS = {
  /**
   * YÜKSEK RİSK - Çok yaygın dosya uzantıları
   * Ekstra validasyon gerektirir
   */
  HIGH_RISK: new Set([
    'zip',  // Google TLD (2023) - ZIP arşiv dosyası
    'mov',  // Google TLD (2023) - QuickTime video
    'app',  // gTLD - macOS uygulaması
    'dev',  // gTLD - Geliştirici dosyaları
  ]),

  /**
   * ORTA-YÜKSEK RİSK - Yaygın programlama/dosya uzantıları
   */
  MEDIUM_HIGH_RISK: new Set([
    'ai',   // ccTLD Anguilla - Adobe Illustrator
    'io',   // ccTLD British Indian Ocean - Binary data
    'co',   // ccTLD Colombia - Checkout files
    'me',   // ccTLD Montenegro - README files
    'md',   // ccTLD Moldova - Markdown (README.md çok yaygın!)
    'sh',   // ccTLD Saint Helena - Shell scripts
    'rs',   // ccTLD Serbia - Rust source
    'pl',   // ccTLD Poland - Perl scripts
    'py',   // ccTLD Paraguay - Python source
  ]),

  /**
   * ORTA RİSK - Daha az yaygın ama dikkat gerektiren
   */
  MEDIUM_RISK: new Set([
    'tv',   // ccTLD Tuvalu - Video files
    'fm',   // ccTLD Micronesia - FileMaker
    'dj',   // ccTLD Djibouti - Django projects
    'im',   // ccTLD Isle of Man - Image files
    'ws',   // ccTLD Samoa - WordStar
    'cc',   // ccTLD Cocos Islands - C++ source
    'so',   // ccTLD Somalia - Shared objects (Linux .so files)
    'nu',   // ccTLD Niue - NuMega files
    'to',   // ccTLD Tonga - Torrent files
    'am',   // ccTLD Armenia - Audio files
    'pm',   // ccTLD St. Pierre - PageMaker
  ]),

  /**
   * DÜŞÜK RİSK - Nadiren dosya uzantısı olarak kullanılır
   */
  LOW_RISK: new Set([
    'la', 'ac', 'in', 'cm', 'gs', 'gg', 'ms', 'ps', 'su',
    'ax', 'cx', 'mx', 'sx', 'as', 'is', 'it', 'at', 'be',
    'de', 'es', 'fr', 'uk', 'us', 'ca', 'au', 'jp', 'kr',
    'cn', 'ru', 'br', 'nl',
    // gTLDs that could be files
    'com', 'net', 'org', 'info', 'pro', 'biz', 'name', 'mobi',
    'jobs', 'one', 'bar', 'bid', 'bio', 'cab', 'cat', 'ceo',
    'dad', 'dog', 'eco', 'fit', 'fun', 'ink', 'kim', 'ltd',
    'mba', 'new', 'now', 'pet', 'phd', 'pin', 'pub', 'red',
    'run', 'ski', 'soy', 'tax', 'top', 'vet', 'win', 'wtf', 'xyz',
  ]),
};

/**
 * Dosya adı olarak sıkça kullanılan önekler
 * Bu öneklerle başlayan ve TLD-collision uzantısıyla biten stringler
 * muhtemelen dosyadır, domain değil
 */
export const COMMON_FILENAME_PREFIXES = new Set([
  // Documentation
  'readme', 'changelog', 'license', 'licence', 'contributing', 'authors',
  'history', 'news', 'todo', 'copying', 'notice', 'patents', 'security',

  // Config files
  'config', 'configuration', 'settings', 'options', 'preferences', 'prefs',
  'env', 'environment', 'local', 'development', 'production', 'staging', 'test',
  '.env', '.gitignore', '.dockerignore', '.eslintrc', '.prettierrc',

  // Main files
  'main', 'index', 'app', 'application', 'server', 'client', 'worker',
  'init', 'setup', 'install', 'bootstrap', 'entry', 'start', 'run',

  // Data files
  'data', 'database', 'db', 'backup', 'dump', 'export', 'import',
  'input', 'output', 'result', 'results', 'report', 'reports',

  // Log files
  'access', 'error', 'debug', 'info', 'warn', 'warning', 'audit',
  'system', 'application', 'server', 'request', 'response', 'event',

  // Test files
  'test', 'tests', 'spec', 'specs', 'unit', 'integration', 'e2e',
  'fixture', 'fixtures', 'mock', 'mocks', 'stub', 'stubs',

  // Build files
  'build', 'dist', 'output', 'bundle', 'vendor', 'lib', 'libs',
  'package', 'manifest', 'makefile', 'dockerfile', 'vagrantfile',

  // Source organization
  'src', 'source', 'sources', 'include', 'includes', 'util', 'utils',
  'helper', 'helpers', 'common', 'shared', 'core', 'base', 'module',

  // Specific file types
  'script', 'scripts', 'style', 'styles', 'asset', 'assets',
  'image', 'images', 'icon', 'icons', 'font', 'fonts',
  'template', 'templates', 'view', 'views', 'layout', 'layouts',
  'component', 'components', 'model', 'models', 'controller', 'controllers',

  // Version/backup indicators
  'v1', 'v2', 'v3', 'old', 'new', 'backup', 'copy', 'original', 'final',

  // Common single-word filenames
  'requirements', 'dependencies', 'gemfile', 'podfile', 'cartfile',
  'procfile', 'rakefile', 'gulpfile', 'gruntfile', 'webpack',

  // Hostname patterns (for logs)
  'hostname', 'host', 'client', 'server', 'node', 'worker', 'master',
  'primary', 'secondary', 'replica', 'slave', 'proxy', 'gateway',
]);

/**
 * Dosya yolu belirteçleri
 * Bu karakterler/patternler stringin bir dosya yolunun parçası olduğunu gösterir
 */
export const FILE_PATH_INDICATORS = [
  '/',      // Unix path separator
  '\\',     // Windows path separator
  './',     // Relative path
  '../',    // Parent directory
  '~/',     // Home directory
  'C:',     // Windows drive
  'D:',     // Windows drive
  '/var/',
  '/etc/',
  '/usr/',
  '/home/',
  '/tmp/',
  '/opt/',
  '/log/',
  '/logs/',
];

/**
 * Get all TLD collision extensions (all risk levels)
 */
export function getAllTLDCollisionExtensions(): Set<string> {
  return new Set([
    ...TLD_FILE_EXTENSION_COLLISIONS.HIGH_RISK,
    ...TLD_FILE_EXTENSION_COLLISIONS.MEDIUM_HIGH_RISK,
    ...TLD_FILE_EXTENSION_COLLISIONS.MEDIUM_RISK,
    ...TLD_FILE_EXTENSION_COLLISIONS.LOW_RISK,
  ]);
}

/**
 * Get high risk TLD collision extensions
 */
export function getHighRiskTLDCollisions(): Set<string> {
  return new Set([
    ...TLD_FILE_EXTENSION_COLLISIONS.HIGH_RISK,
    ...TLD_FILE_EXTENSION_COLLISIONS.MEDIUM_HIGH_RISK,
  ]);
}

/**
 * Check if extension is definitely not a TLD
 */
export function isDefinitelyNotTLD(extension: string): boolean {
  return NON_TLD_EXTENSIONS.has(extension.toLowerCase());
}

/**
 * Check if extension has TLD collision risk
 */
export function hasTLDCollisionRisk(extension: string): boolean {
  const ext = extension.toLowerCase();
  return (
    TLD_FILE_EXTENSION_COLLISIONS.HIGH_RISK.has(ext) ||
    TLD_FILE_EXTENSION_COLLISIONS.MEDIUM_HIGH_RISK.has(ext) ||
    TLD_FILE_EXTENSION_COLLISIONS.MEDIUM_RISK.has(ext)
  );
}

/**
 * Get collision risk level for an extension
 */
export function getCollisionRiskLevel(extension: string): 'HIGH' | 'MEDIUM_HIGH' | 'MEDIUM' | 'LOW' | 'NONE' {
  const ext = extension.toLowerCase();

  if (TLD_FILE_EXTENSION_COLLISIONS.HIGH_RISK.has(ext)) return 'HIGH';
  if (TLD_FILE_EXTENSION_COLLISIONS.MEDIUM_HIGH_RISK.has(ext)) return 'MEDIUM_HIGH';
  if (TLD_FILE_EXTENSION_COLLISIONS.MEDIUM_RISK.has(ext)) return 'MEDIUM';
  if (TLD_FILE_EXTENSION_COLLISIONS.LOW_RISK.has(ext)) return 'LOW';

  return 'NONE';
}
