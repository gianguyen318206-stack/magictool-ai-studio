import { AspectRatio, ImageStyle, MotionPreset } from '@/types';

export const ASPECT_RATIOS: { value: AspectRatio; shortLabel: string; label: string; size: string; iconRatio: string }[] = [
  { value: '1:1', shortLabel: '(Vuông)', label: '1:1 (Vuông)', size: '1024x1024', iconRatio: 'aspect-square' },
  { value: '16:9', shortLabel: '(Ngang)', label: '16:9 (Ngang)', size: '1280x720', iconRatio: 'aspect-video' },
  { value: '9:16', shortLabel: '(Dọc)', label: '9:16 (Dọc)', size: '720x1280', iconRatio: 'aspect-[9/16]' },
  { value: '4:3', shortLabel: '(Tiêu chuẩn)', label: '4:3 (Tiêu chuẩn)', size: '1024x768', iconRatio: 'aspect-[4/3]' },
  { value: '3:4', shortLabel: '(Chân dung)', label: '3:4 (Chân dung)', size: '768x1024', iconRatio: 'aspect-[3/4]' },
];

export const IMAGE_STYLES: {
  value: ImageStyle;
  label: string;
  desc: string;
  promptSuffix: string;
  thumb: string;
  gradient: string;
}[] = [
  {
    value: 'realistic',
    label: 'Chân thực',
    desc: 'Chi tiết siêu thực, ánh sáng điện ảnh 8K',
    promptSuffix: 'hyper-realistic, photorealistic, 8k resolution, cinematic lighting, ultra detailed',
    thumb: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=300&auto=format&fit=crop&q=80',
    gradient: 'from-blue-600 to-indigo-900',
  },
  {
    value: 'cartoon',
    label: 'Hoạt hình',
    desc: 'Phong cách Pixar / Anime sống động',
    promptSuffix: 'cute animation style, Pixar Disney aesthetic, vibrant colors, expressive lighting',
    thumb: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=300&auto=format&fit=crop&q=80',
    gradient: 'from-purple-500 to-pink-600',
  },
  {
    value: 'minimalist',
    label: 'Tối giản',
    desc: 'Bố cục tinh gọn, hiện đại, sạch sẽ',
    promptSuffix: 'minimalist modern design, clean composition, soft studio lighting, pastel & neon accents',
    thumb: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80',
    gradient: 'from-cyan-500 to-blue-600',
  },
  {
    value: 'game3d',
    label: 'Giả tưởng',
    desc: 'Đồ họa điện ảnh Unreal Engine sắc nét',
    promptSuffix: 'Unreal Engine 5 render, fantasy digital art masterpiece, volumetric lighting, raytracing',
    thumb: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&auto=format&fit=crop&q=80',
    gradient: 'from-amber-500 to-orange-700',
  },
  {
    value: 'scifi',
    label: 'Khoa học',
    desc: 'Tương lai Sci-Fi, Cyberpunk, công nghệ cao',
    promptSuffix: 'futuristic sci-fi concept art, holographic neon glow, high-tech atmosphere, cinematic 8k',
    thumb: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&auto=format&fit=crop&q=80',
    gradient: 'from-indigo-600 to-purple-900',
  },
];

export const MOTION_PRESETS: { value: MotionPreset; label: string; desc: string; promptSuffix: string }[] = [
  { value: 'static', label: 'Tĩnh (Static)', desc: 'Camera cố định, chủ thể chuyển động mượt', promptSuffix: 'locked-off camera, subtle natural subject motion, smooth 60fps' },
  { value: 'dolly', label: 'Dolly Zoom', desc: 'Phóng to/thu nhỏ máy quay điện ảnh', promptSuffix: 'smooth cinematic dolly zoom in towards subject, shallow depth of field' },
  { value: 'pan', label: 'Lướt ngang (Pan)', desc: 'Chuyển động camera quét ngang màn hình', promptSuffix: 'smooth cinematic slow pan across the scene, fluid camera tracking' },
  { value: 'drone', label: 'Bay cao (Drone)', desc: 'Góc máy FPV / Flycam từ trên cao bao quát', promptSuffix: 'sweeping aerial drone shot, cinematic establishing view, smooth motion' },
];

export const VOICE_OPTIONS = [
  { id: 'vi-VN-HoaiMyNeural', name: 'Hoài My (Nữ miền Nam)', desc: 'Truyền cảm, chuẩn TikTok & Reels viral' },
  { id: 'vi-VN-NamMinhNeural', name: 'Nam Minh (Nam miền Bắc)', desc: 'Thời sự, phóng sự, thuyết minh tin tức' },
  { id: 'en-US-JennyNeural', name: 'Jenny (Nữ tiếng Anh)', desc: 'Tự nhiên, kênh quốc tế' },
  { id: 'en-US-GuyNeural', name: 'Guy (Nam tiếng Anh)', desc: 'Mạnh mẽ, kênh tin tức quốc tế' },
];

export const SUBTITLE_STYLES = [
  { id: 'tiktok-yellow', label: 'Vàng viền đen (TikTok Viral)', color: '#FFFF00', outline: '#000000' },
  { id: 'modern-white', label: 'Trắng viền đen (Hiện đại)', color: '#FFFFFF', outline: '#000000' },
  { id: 'neon-cyan', label: 'Xanh Neon (Công nghệ / Sci-Fi)', color: '#00FFFF', outline: '#000000' },
];

export const BG_MUSIC_OPTIONS = [
  { id: 'none', label: 'Không nhạc nền (Chỉ giọng đọc)' },
  { id: 'cinematic', label: 'Cinematic Ambient (Sâu lắng, kịch tính)' },
  { id: 'lofi', label: 'Chill Lofi (Nhẹ nhàng, thư giãn)' },
  { id: 'upbeat', label: 'Upbeat Tech (Hào hứng, hiện đại)' },
];

export const SUPPORT_MAGIC_MODELS = [
  { id: 'ag/gemini-4-argon', name: 'Gemini 4 Argon (Siêu cấp - 9Router)', badge: 'Khuyên dùng' },
  { id: 'oc/muse-spark-1.3-contributor-free', name: 'Muse Spark 1.3 (Meta AI)', badge: 'Nhanh' },
  { id: 'muse-web/muse-chat', name: 'Muse AI Chat (Quỹ 1 Tỷ Token)', badge: '1B Token' },
  { id: 'ag/claude-opus-5-5', name: 'Claude Opus 5.5 (9Router)', badge: 'Pro' },
  { id: 'ag/claude-sonnet-5-5', name: 'Claude Sonnet 5.5 (9Router)', badge: 'Pro' },
];

export const DEMO_SAMPLE_IMAGES = [
  {
    title: 'Phi hành gia vũ trụ điện ảnh',
    url: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=1080&auto=format&fit=crop&q=80',
    prompt: 'Một nhà du hành vũ trụ mặc bộ đồ không gian hiện đại, chi tiết chân thực, ánh sáng điện ảnh 8K.',
  },
  {
    title: 'Thành phố Cyberpunk 2099',
    url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1080&auto=format&fit=crop&q=80',
    prompt: 'Thành phố tương lai Cyberpunk rực rỡ ánh đèn neon phản chiếu trên mặt đường mưa ướt, điện ảnh 8K.',
  },
  {
    title: 'Không gian nghệ thuật trừu tượng',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080&auto=format&fit=crop&q=80',
    prompt: 'Dòng chảy ánh sáng lụa tím và xanh lam phát sáng trong không gian tối giản hiện đại.',
  },
  {
    title: 'Hoàng hôn siêu thực trên biển',
    url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1080&auto=format&fit=crop&q=80',
    prompt: 'Bầu trời hoàng hôn tím hồng phản chiếu trên mặt nước phẳng lặng, phong cách nghệ thuật kỳ ảo.',
  },
  {
    title: 'Trạm không gian ngoài quỹ đạo',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1080&auto=format&fit=crop&q=80',
    prompt: 'Góc nhìn từ trạm vũ trụ nhìn xuống bề mặt Trái Đất rực sáng ánh đèn thành phố về đêm, độ phân giải 8K.',
  },
];

export const DEMO_SAMPLE_VIDEOS = [
  {
    title: 'Dải ngân hà & Vũ trụ chuyển động',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-1610-large.mp4',
    thumb: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&auto=format&fit=crop&q=80',
    prompt: 'Cảnh quay điện ảnh bay xuyên qua dải ngân hà rực rỡ ánh sao phát sáng trong không gian sâu thẳm.',
  },
  {
    title: 'Sóng ánh sáng Neon Cyberpunk',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-abstract-purple-and-blue-neon-lines-32605-large.mp4',
    thumb: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=400&auto=format&fit=crop&q=80',
    prompt: 'Các luồng sóng ánh sáng neon tím và xanh chuyển động mượt mà theo phong cách tương lai Sci-Fi.',
  },
  {
    title: 'Mây trôi trên đỉnh núi hoàng hôn',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-traffic-at-night-11-large.mp4',
    thumb: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop&q=80',
    prompt: 'Góc máy Flycam bay trên bầu trời thành phố rực rỡ ánh đèn về đêm, chuyển động mượt mà.',
  },
  {
    title: 'Hạt năng lượng phát sáng lơ lửng',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-blue-and-purple-particles-floating-in-space-39776-large.mp4',
    thumb: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
    prompt: 'Hàng ngàn hạt ánh sáng pha lê tím và xanh lam lơ lửng chuyển động chậm trong không gian kỳ ảo.',
  },
  {
    title: 'Bề mặt hành tinh nhìn từ quỹ đạo',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-spinning-around-the-earth-in-space-29352-large.mp4',
    thumb: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=400&auto=format&fit=crop&q=80',
    prompt: 'Góc quay điện ảnh xoay quanh hành tinh phát sáng nhìn từ ngoài không gian vũ trụ 8K.',
  },
];
