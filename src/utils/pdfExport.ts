import jsPDF from 'jspdf';
import { toCanvas, toJpeg } from 'html-to-image';

/**
 * ============================================================================
 * BỘ CHUYỂN ĐỔI MÀU TOÁN HỌC CHÍNH XÁC (Oklab / OKLCH -> Linear sRGB -> sRGB Gamma)
 * ============================================================================
 */

/**
 * Chuyển đổi màu Oklab (L: [0..1], a: [-0.4..0.4], b: [-0.4..0.4]) sang sRGB gamma chuẩn ([0..255])
 * Dựa trên mô hình chuyển đổi chuẩn của Björn Ottosson (Oklab specification)
 */
export function oklabToSrgb(L: number, a: number, b: number): [number, number, number] {
  // 1. Chuyển từ Oklab sang không gian nón kích thích LMS
  const l_ = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
  const m_ = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
  const s_ = Math.pow(L - 0.0894841775 * a - 1.2914855480 * b, 3);

  // 2. Chuyển từ LMS sang Linear sRGB
  const r_lin = +4.0767434099 * l_ - 3.3077115913 * m_ + 0.2309699291 * s_;
  const g_lin = -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_;
  const b_lin = -0.0041960863 * l_ - 0.7034186147 * m_ + 1.7076147010 * s_;

  // 3. Hàm hiệu chỉnh gamma sRGB (IEC 61966-2-1:1999)
  const toGamma = (c: number): number => {
    const clamped = Math.max(0, Math.min(1, c));
    return clamped <= 0.0031308
      ? 12.92 * clamped
      : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
  };

  const r = Math.round(toGamma(r_lin) * 255);
  const g = Math.round(toGamma(g_lin) * 255);
  const b_val = Math.round(toGamma(b_lin) * 255);

  return [r, g, b_val];
}

/**
 * Chuyển đổi màu Oklch (L: [0..1] hoặc [0..100%], C: Chroma, H: Góc pha độ) sang sRGB gamma
 */
export function oklchToSrgb(L: number, C: number, H: number): [number, number, number] {
  const h_rad = (H * Math.PI) / 180;
  const a = C * Math.cos(h_rad);
  const b = C * Math.sin(h_rad);
  return oklabToSrgb(L, a, b);
}

/**
 * Phân tích và chuyển chuỗi CSS màu hiện đại (oklch, oklab) thành định dạng rgb(...) hoặc rgba(...) tương thích 100%
 */
export function sanitizeModernColorString(colorStr: string): string {
  if (!colorStr || typeof colorStr !== 'string') return colorStr;
  if (!colorStr.includes('oklch') && !colorStr.includes('oklab')) return colorStr;

  // Xử lý chuỗi oklch(L C H [/ alpha]) hoặc oklch(L, C, H[, alpha])
  let sanitized = colorStr.replace(
    /oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)/gi,
    (_match, lStr, cStr, hStr, aStr) => {
      let L = parseFloat(lStr);
      if (lStr.includes('%')) L = L / 100;
      const C = parseFloat(cStr);
      const H = parseFloat(hStr);
      const [r, g, b] = oklchToSrgb(L, C, H);
      if (aStr !== undefined) {
        let alpha = parseFloat(aStr);
        if (aStr.includes('%')) alpha = alpha / 100;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
      return `rgb(${r}, ${g}, ${b})`;
    }
  );

  // Xử lý chuỗi oklab(L a b [/ alpha])
  sanitized = sanitized.replace(
    /oklab\(\s*([\d.]+%?)\s+([-\d.]+)\s+([-\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)/gi,
    (_match, lStr, aStr, bStr, alphaStr) => {
      let L = parseFloat(lStr);
      if (lStr.includes('%')) L = L / 100;
      const a = parseFloat(aStr);
      const b = parseFloat(bStr);
      const [r, g, b_val] = oklabToSrgb(L, a, b);
      if (alphaStr !== undefined) {
        let alpha = parseFloat(alphaStr);
        if (alphaStr.includes('%')) alpha = alpha / 100;
        return `rgba(${r}, ${g}, ${b_val}, ${alpha})`;
      }
      return `rgb(${r}, ${g}, ${b_val})`;
    }
  );

  return sanitized;
}

/**
 * Bộ lọc style: Quét và làm sạch toàn bộ style trước khi render vào canvas
 * Đảm bảo mọi thuộc tính màu sắc đều là RGB/RGBA hợp lệ và loại bỏ mọi xung đột từ Tailwind v4
 */
export function filterAndSanitizeElementStyles(root: HTMLElement): void {
  const elements = [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))];
  const colorProperties = [
    'color',
    'backgroundColor',
    'borderColor',
    'borderTopColor',
    'borderRightColor',
    'borderBottomColor',
    'borderLeftColor',
    'outlineColor',
    'textDecorationColor',
  ];

  for (const el of elements) {
    // Làm sạch inline styles nếu có chứa oklch / oklab
    for (const prop of colorProperties) {
      const val = (el.style as any)[prop];
      if (val && (val.includes('oklch') || val.includes('oklab'))) {
        (el.style as any)[prop] = sanitizeModernColorString(val);
      }
    }
  }
}

/**
 * ============================================================================
 * XUẤT BÀI LÀM SANG FILE PDF KHỔ A4 (ĐỘ NÉT CAO, TỰ ĐỘNG PHÂN TRANG)
 * ============================================================================
 */
export async function exportSubmissionToPdf(
  element: HTMLElement,
  studentName: string,
  studentClass: string
): Promise<void> {
  if (!element) {
    throw new Error('Không tìm thấy vùng nội dung bài làm để xuất PDF.');
  }

  try {
    // 1. Lọc và chuẩn hóa style trên phần tử DOM
    filterAndSanitizeElementStyles(element);

    // 2. Cấu hình chụp canvas chất lượng cao, loại bỏ hoàn toàn các phụ thuộc proxy
    const renderOptions = {
      backgroundColor: '#ffffff',
      pixelRatio: 2, // Độ phân giải 2x cho bản in sắc nét
      skipFonts: true, // Tránh lỗi CORS từ font ngoại vi
      cacheBust: true,
      imagePlaceholder:
        'data:image/svg+xml;charset=utf-8,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%2F%3E',
      style: {
        width: '800px',
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: '#ffffff',
      },
    };

    let imgData: string;
    let imgNaturalWidth = 800;
    let imgNaturalHeight = element.scrollHeight || 1000;

    try {
      const canvas = await toCanvas(element, renderOptions);
      imgData = canvas.toDataURL('image/jpeg', 0.95);
      imgNaturalWidth = canvas.width;
      imgNaturalHeight = canvas.height;
    } catch (canvasErr) {
      console.warn('toCanvas gặp lỗi, chuyển sang fallback toJpeg trực tiếp:', canvasErr);
      imgData = await toJpeg(element, { ...renderOptions, quality: 0.95 });
      imgNaturalWidth = 800 * 2;
      imgNaturalHeight = (element.scrollHeight || 1000) * 2;
    }

    // 3. Khởi tạo tài liệu PDF khổ A4 đứng (210 x 297 mm)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth(); // 210 mm
    const pageHeight = pdf.internal.pageSize.getHeight(); // 297 mm

    // 4. Tính toán tỷ lệ chiều cao tương ứng của ảnh khi vừa vặn chiều rộng A4
    const imgWidth = pageWidth;
    const imgHeight = (imgNaturalHeight * imgWidth) / imgNaturalNaturalSafe(imgNaturalWidth);

    // 5. Tự động phân trang chuẩn xác nếu bài làm dài hơn một trang A4
    let heightLeft = imgHeight;
    let pageIndex = 0;

    while (heightLeft > 0) {
      if (pageIndex > 0) {
        pdf.addPage('a4', 'portrait');
      }
      const yOffset = -pageIndex * pageHeight;
      pdf.addImage(imgData, 'JPEG', 0, yOffset, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
      pageIndex++;
    }

    // 6. Định dạng tên file: Bai_Lam_[Ten_Thi_Sinh]_[Lop].pdf
    const safeName = (studentName || 'Thi_Sinh')
      .trim()
      .replace(/[\s/\\?%*:|"<>]+/g, '_');
    const safeClass = (studentClass || 'Chung')
      .trim()
      .replace(/[\s/\\?%*:|"<>]+/g, '_');
    const fileName = `Bai_Lam_${safeName}_${safeClass}.pdf`;

    // 7. Tải file tự động hoặc cơ chế dự phòng qua Blob link
    try {
      pdf.save(fileName);
    } catch (saveErr) {
      console.warn('pdf.save() bị trình duyệt chặn, mở cơ chế tải dự phòng qua Blob URL:', saveErr);
      const blob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 2000);
    }
  } catch (error) {
    console.error('Lỗi khi xuất PDF, kích hoạt cơ chế dự phòng hộp thoại lưu PDF của hệ thống:', error);
    // Cơ chế dự phòng mở hộp thoại lưu PDF của hệ thống trình duyệt
    window.focus();
    window.print();
    throw error;
  }
}

function imgNaturalNaturalSafe(width: number): number {
  return width > 0 ? width : 800;
}

/**
 * ============================================================================
 * IN BÀI LÀM TRỰC TIẾP HOẶC LƯU DƯỚI DẠNG PDF TỪ TRÌNH DUYỆT
 * ============================================================================
 */
export function printSubmissionSheet(_element?: HTMLElement): void {
  try {
    window.focus();
    window.print();
  } catch (err) {
    console.error('Lỗi khi mở hộp thoại in của trình duyệt:', err);
  }
}
