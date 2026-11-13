# V2.4 Real-Device iPhone Calibration & Tea-Paper Palette Specification

> **Mục đích tài liệu (`V2_4_IPHONE_AND_PALETTE_SPEC.md`):** Tài liệu này hướng dẫn AI Coding Agent (Antigravity) tinh chỉnh hệ thống tại `/Volumes/Data/Quotes` dựa trên **ảnh chụp màn hình thực tế khi đăng lên TikTok iOS (màn hình iPhone tỷ lệ 9:19.5)**, giải quyết dứt điểm 4 vấn đề thực chiến:
> 1. **Nâng cấp Màu nền Bản Sáng (`MINIMAL_LIGHT`) từ trắng bệch `#F6F5F0` sang "Giấy Dó Trà Ấm có Chiều sâu Tâm sáng" (`Radial Tea-Paper Parchment`):** Xóa bỏ hiện tượng lớp phủ đen của TikTok làm xỉn màu nền thành "xám xi-măng bẩn" ở đỉnh/đáy màn hình, đồng thời làm nổi bật các nút Tim/Comment/Lưu màu trắng bên phải của TikTok.
> 2. **Đưa chữ ký `• TRÀ NGUỘI` lên ngay dưới chân khối chữ (Cách B – `marginTop: 34px`):** Thoát 100% khỏi vùng tối đáy màn hình và không bao giờ đụng tên tài khoản TikTok.
> 3. **Hiệu chỉnh Tọa độ chống cắt viền trên iPhone 9:19.5 (`marginLeft: 132px`, `headerTop: 295px`):** Bù trừ ~55px bị TikTok crop ở hai mép trái/phải và hạ thanh `CHÉN 01 — NGHỈ` tách hẳn khỏi thanh Tìm kiếm trên đỉnh màn hình.
> 4. **Đồng bộ tức thì tư thế buông tay ngồi nghỉ ngay khi dòng `"Mai tính..."` chớm hiện ra.**

## 1. Giải Phẫu Lỗi Màu Nền Sáng Trên TikTok Thực Tế & Bảng Màu Mới (`src/theme/palettes.ts`)

### Vì sao nền `#F6F5F0` cũ lên TikTok bị xấu?
* `#F6F5F0` có độ sáng 96% (quá trắng). Vì giao diện TikTok dùng chữ và icon màu trắng, ứng dụng TikTok tự động phủ **2 lớp gradient đen mờ ở 20% đỉnh và 30% đáy video**. Đen mờ đè lên trắng lạnh tạo ra **vệt xám xi-măng xỉn màu** ở đầu và cuối màn hình, đồng thời làm chìm nghỉm nút Tim/Lưu màu trắng ở cạnh phải.

### Bảng màu `MINIMAL_LIGHT` mới (Tông Giấy Trà Ấm + Radial Vignette nhẹ):
* Hạ độ sáng nền xuống vùng **85%–89%** với sắc kem trà ấm (`center: #F1EAE0` $\rightarrow$ `edge: #DFD5C5`). Khi gradient tối của TikTok phủ lên cạnh trên/dưới, sắc ấm chuyển thành bóng nâu trà tự nhiên (warm sepia) thay vì xám bẩn, mắt xem ban đêm cực dịu và nút trắng của TikTok nổi rõ hơn hẳn.

```typescript
export interface ThemePalette {
  id: string;
  name: string;
  background: string;       // Màu nền chính (tâm sáng)
  backgroundEdge: string;   // Màu chuyển êm ra 4 viền (tạo chiều sâu giấy & đỡ chói)
  surfaceSubtle: string;    // Đường kẻ lưới Swiss Grid rõ vừa đủ trên nền giấy trà
  inkPrimary: string;
  inkSecondary: string;
  accent: string;
  grainOpacity: number;
}

export const THEME_PALETTES: Record<string, ThemePalette> = {
  MINIMAL_LIGHT: {
    id: 'MINIMAL_LIGHT',
    name: 'Warm Tea Paper (Default Light)',
    background: '#F1EAE0',      // Tâm giấy kem trà ấm dịu mắt
    backgroundEdge: '#DFD5C5',  // Viền trầm ấm giúp nổi bật icon trắng của TikTok & hòa mượt bóng đổ đáy
    surfaceSubtle: '#C9BFAEE6', // Đường kẻ lưới rõ nét, thanh lịch trên nền giấy trà
    inkPrimary: '#1E1B18',      // Mực đen nâu than sâu
    inkSecondary: '#6B6259',    // Nâu xám ấm cho CHÉN 01 & TRÀ NGUỘI
    accent: '#CE472E',          // Đỏ gạch trầm ấm tiệp với nền giấy trà
    grainOpacity: 0.055,        // Tăng nhẹ độ hạt giấy để không bị bộ nén H.264 của TikTok làm phẳng bệt
  },
  MINIMAL_DARK: {
    id: 'MINIMAL_DARK',
    name: 'Roasted Tea Charcoal (Dark)',
    background: '#1A1816',      // Tâm than trà ấm (hòa tan 100% lớp phủ đen của TikTok)
    backgroundEdge: '#11100F',
    surfaceSubtle: '#2E2B28',
    inkPrimary: '#EFECE6',
    inkSecondary: '#8F887F',
    accent: '#E5593F',
    grainOpacity: 0.045,
  },
  WARM_NOIR: {
    id: 'WARM_NOIR',
    name: 'Aged Parchment (Optional)',
    background: '#EAE0D0',
    backgroundEdge: '#D6C8B4',
    surfaceSubtle: '#C2B49F',
    inkPrimary: '#26201C',
    inkSecondary: '#73665C',
    accent: '#C25934',
    grainOpacity: 0.06,
  },
  SLATE_CALM: {
    id: 'SLATE_CALM',
    name: 'Celadon Tea Mist (Optional)',
    background: '#E7ECE9',
    backgroundEdge: '#D3DCD7',
    surfaceSubtle: '#BCC7C1',
    inkPrimary: '#1B2320',
    inkSecondary: '#5F6D68',
    accent: '#B84A39',
    grainOpacity: 0.045,
  },
};

export const LAYOUT_TOKENS = {
  width: 1080,
  height: 1920,
  fps: 60,
  strokeWidth: 3.1,
  // Đã bù trừ ~55px bị TikTok crop ở mép trái/phải trên màn hình iPhone 9:19.5
  swissGrid: {
    marginLeft: 132,         // Hiển thị thực tế trên iPhone cách mép trái ~48px rất thoáng
    marginRightTop: 132,     // Đối xứng với lề trái ở thanh Header trên
    marginRightBottom: 230,  // Né trọn vẹn cột Avatar + Tim + Comment + Lưu bên phải
    headerTop: 295,          // Hạ thấp xuống dưới thanh "Tìm nội dung liên quan" của TikTok
    headerHeight: 62,
    stageTop: 357,           // Sân khấu Animation từ y = 357 -> y = 852
    stageHeight: 495,
    typographyTop: 896,      // Khối chữ + chữ ký • TRÀ NGUỘI nằm gọn trong vùng sáng y: 896 -> 1270
  },
} as const;
```

## 2. Cập Nhật `MinimalistBackground.tsx` (Áp Dụng Radial Gradient & Bỏ Footer Đáy Cũ)

1. Thay `backgroundColor: palette.background` bằng `background: radial-gradient(ellipse at 50% 44%, ${palette.background} 0%, ${palette.backgroundEdge} 100%)` để mặt giấy có chiều sâu ánh sáng tự nhiên ở trung tâm.
2. **Xóa khối Footer `• TRÀ NGUỘI` ở đáy màn hình** khỏi `MinimalistBackground.tsx` (để chuyển sang đặt ngay dưới chân khối chữ trong `AdaptiveTypography.tsx` theo **Cách B**).

```tsx
// Trong MinimalistBackground.tsx:
return (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse at 50% 44%, ${palette.background} 0%, ${palette.backgroundEdge} 100%)`,
    }}
  >
    {/* Giữ nguyên lớp SVG Noise, Thanh Header CHÉN 01 (top: 295), Crosshair tâm sân khấu và Đường kẻ ngang dưới (y = 852) */}
    {/* XÓA phần Footer ở đáy màn hình cũ để không bao giờ đụng vùng tối & tên kênh TikTok */}
  </AbsoluteFill>
);
```

## 3. Đặt Chữ Ký `• TRÀ NGUỘI` Ngay Dưới Khối Chữ (Cách B) Trong `AdaptiveTypography.tsx`

Ngay bên dưới vòng lặp `sync.segmentTimings.map(...)` bên trong khung `AdaptiveTypography.tsx`, thêm dòng chữ ký thương hiệu **`• TRÀ NGUỘI`** cách dòng chữ cuối **`34px`**, hiện êm lên khi dòng chữ đầu tiên đã bắt đầu xuất hiện (hoặc hiện sẵn nhẹ nhàng cùng đường rãnh):

```tsx
{/* Đặt ngay sau danh sách các dòng quote bên trong thẻ div chính của AdaptiveTypography.tsx */}
<div
  style={{
    marginTop: 34,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    opacity: trackOpacity * 0.9,
  }}
>
  <span
    style={{
      width: 7,
      height: 7,
      borderRadius: '50%',
      backgroundColor: palette.accent,
      display: 'inline-block',
    }}
  />
  <span
    style={{
      fontFamily: "'Inter', sans-serif",
      fontSize: 19,
      letterSpacing: '0.24em',
      textTransform: 'uppercase',
      color: palette.inkSecondary,
      fontWeight: 500,
    }}
  >
    {props.brandText}
  </span>
</div>
```
*(Nhờ đặt ngay dưới dòng thứ 4 với `marginTop: 34px`, dòng `• TRÀ NGUỘI` rơi vào khoảng `y ≈ 1235px` — nằm trọn trong vùng sáng sạch sẽ, thẳng trục dọc với câu chữ và cách xa tên kênh `nói vậy thôi` ở dưới hơn `150px`!).*

## 4. Khớp Tức Thì Tư Thế Ngồi Nghỉ Khi Hiện Dòng `"Mai tính..."` (`timelineSync.ts` & `TensionReleaseArchetype.tsx`)

Trong ảnh chụp màn hình tại giây dòng thứ 4 đang hiện mờ ra, tay nhân vật vẫn chống vào đá vì hai lý do nhỏ cần sửa ngay:
1. Trong `src/engine/timelineSync.ts`: Đặt `detectedPivotFrame = Math.max(introBufferFrames, startFrame - Math.round(0.25 * fps));` (kích hoạt chuyển trạng thái sớm hơn `0.25s` ngay ở nhịp nghỉ trước câu kết, để khi câu kết hiện mờ ra tới 40% là nhân vật đã vào tư thế ngồi nghỉ).
2. Trong `src/components/archetypes/TensionReleaseArchetype.tsx`: Hạ ngưỡng chuyển tay/chân từ `sitT < 0.5` xuống **`sitT < 0.18`** để ngay khi bắt đầu hạ trọng tâm là nhân vật buông tay khỏi khối đá và duỗi chân ngồi tựa lưng tự nhiên.
