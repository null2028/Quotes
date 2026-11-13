export interface AirtableCreateFieldSpec {
  name: string;
  type: 'singleLineText' | 'multilineText' | 'singleSelect' | 'multipleSelects';
  description?: string;
  options?: {
    choices: Array<{
      name: string;
      color?: string;
    }>;
  };
}

export interface AirtableBatchPatchJob {
  batchId: string;
  baseId: string;
  tableId?: string;
  ensureTable?: {
    name: string;
    description?: string;
    fields: AirtableCreateFieldSpec[];
  };
  description: string;
  records: Array<{
    id: string;
    code: string;
    fields: Record<string, unknown>;
  }>;
  createRecords?: Array<{
    code: string;
    fields: Record<string, unknown>;
  }>;
}

export const CURRENT_AIRTABLE_BATCH_JOB: AirtableBatchPatchJob = {
  batchId: 'batch-2026-11-12-wordplay-lab-me5-w058-w072-v1',
  baseId: 'app9rk1rYkbXuIi3e',
  tableId: 'tblG0SqIZOVn5D2NJ',
  description:
    'Nạp Mẻ 5 (W058–W072: 15 câu nói lái đảo âm thả thính tinh tế khung giờ Morning & Anytime) lên bảng Wordplay & Trend Lab',
  records: [],
  createRecords: [
    {
      code: 'W058',
      fields: {
        ID: 'W058',
        'Kiểu chơi chữ': '1 - Nói lái / Đảo âm',
        'Cặp khóa / Mô-típ': 'Trong lành có ong ↔ Trong lòng có anh',
        'Hạt nhân gốc':
          'Trong lành có ong – trong lòng có anh (Phong Vũ Tech News)',
        'Nội dung Trà Nguội':
          'Sớm mai mở cửa thấy nắng trong lành có ong.\nPha thêm chén trà mới biết… hóa ra trong lòng có anh.',
        'Pivot Word (Đỏ Chu Sa)': 'trong lòng có anh',
        'Đạo cụ sân khấu':
          'Khung cửa gỗ mở đón nắng mai có chú ong nhỏ bay ngang → Làn khói trà ấm vẽ nét chữ thương bên tách sứ',
        'Thời điểm phù hợp': 'Morning',
        'Chủ đề': 'Tình yêu',
        'TikTok Caption':
          'Nắng đầu ngày chỉ làm ấm hiên nhà, còn có người làm ấm luôn cả buổi sáng của mình. 🍵\n\n#tranguoi #noilai #trasang #thathinh',
        'Trạng thái dùng': 'Sẵn sàng dùng',
      },
    },
    {
      code: 'W059',
      fields: {
        ID: 'W059',
        'Kiểu chơi chữ': '1 - Nói lái / Đảo âm',
        'Cặp khóa / Mô-típ': 'Tối em có sang ↔ Sáng em có tôi',
        'Hạt nhân gốc':
          'Tối em có sang – Sáng em có tôi (FPT Shop)',
        'Nội dung Trà Nguội':
          'Nhắn hỏi vu vơ tối em có sang ngồi uống chén trà.\nThực ra là mong mỗi sớm thức dậy… thấy sáng em có tôi chung một mái hiên.',
        'Pivot Word (Đỏ Chu Sa)': 'sáng em có tôi',
        'Đạo cụ sân khấu':
          'Tin nhắn nhỏ gửi lúc chiều muộn → Hiên trà ngập nắng sớm có hai chiếc ghế kê sát nhau',
        'Thời điểm phù hợp': 'Morning',
        'Chủ đề': 'Tình yêu',
        'TikTok Caption':
          'Mượn cớ rủ uống trà buổi tối, mà lời muốn ngỏ thật sự lại nằm ở buổi sáng ngày mai. ☕\n\n#tranguoi #noilai #binhyen #tinhyeu',
        'Trạng thái dùng': 'Sẵn sàng dùng',
      },
    },
    {
      code: 'W060',
      fields: {
        ID: 'W060',
        'Kiểu chơi chữ': '1 - Nói lái / Đảo âm',
        'Cặp khóa / Mô-típ': 'Ngày nắng vàng ↔ Bàn vắng nàng',
        'Hạt nhân gốc':
          'Ngày nắng vàng lại là ngày vắng nàng (VOH Online & FPT Shop)',
        'Nội dung Trà Nguội':
          'Hiên quán đầu ngày trải đầy vệt nắng vàng.\nTrà thơm đã rót đủ hai chén… chỉ tiếc bàn đối diện hôm nay vắng nàng.',
        'Pivot Word (Đỏ Chu Sa)': 'vắng nàng',
        'Đạo cụ sân khấu':
          'Vệt nắng sớm rọi qua tán lá xuống bàn gỗ → Chén trà thứ hai bốc khói bên chiếc ghế trống',
        'Thời điểm phù hợp': 'Morning',
        'Chủ đề': 'Tình yêu',
        'TikTok Caption':
          'Trời đẹp tới mấy mà thiếu người ngồi đối diện thì ấm trà sáng vẫn thấy vơi một nửa. 🍵\n\n#tranguoi #noilai #trasang #nhonhung',
        'Trạng thái dùng': 'Sẵn sàng dùng',
      },
    },
    {
      code: 'W061',
      fields: {
        ID: 'W061',
        'Kiểu chơi chữ': '1 - Nói lái / Đảo âm',
        'Cặp khóa / Mô-típ': 'Thế em là mây ↔ Thấy em là mê',
        'Hạt nhân gốc':
          'Thế em là mây – thấy em là mê (VOH Online & FPT Shop)',
        'Nội dung Trà Nguội':
          'Thế em là mây trôi ngang hiên trà sáng nay sao?\nMà vừa ngước mắt lên nhìn… đã thấy em là mê chẳng dứt.',
        'Pivot Word (Đỏ Chu Sa)': 'thấy em là mê',
        'Đạo cụ sân khấu':
          'Đám mây trắng trôi bồng bềnh qua mái hiên → Nhân vật cầm chén trà ngước nhìn đứng hình',
        'Thời điểm phù hợp': 'Morning',
        'Chủ đề': 'Tình yêu',
        'TikTok Caption':
          'Định ra hiên hít thở chút gió sớm cho tỉnh táo, ai ngờ lại phải lòng ngay từ ánh nhìn đầu ngày. 😄\n\n#tranguoi #noilai #thathinh #tinhyeu',
        'Trạng thái dùng': 'Sẵn sàng dùng',
      },
    },
    {
      code: 'W062',
      fields: {
        ID: 'W062',
        'Kiểu chơi chữ': '1 - Nói lái / Đảo âm',
        'Cặp khóa / Mô-típ': 'Cứ hở là nhắn ↔ Hẳn là nhớ',
        'Hạt nhân gốc':
          'Hở là nhắn thì hẳn là nhớ (BlogAnChoi & Phong Vũ Tech News)',
        'Nội dung Trà Nguội':
          'Giữa ngày bận rộn mà cứ hở là nhắn đôi dòng vu vơ.\nChẳng phải người ta dư thời gian đâu… chỉ tại trong lòng hẳn là nhớ.',
        'Pivot Word (Đỏ Chu Sa)': 'hẳn là nhớ',
        'Đạo cụ sân khấu':
          'Bàn làm việc đầy giấy tờ bận rộn → Điện thoại khẽ sáng lên dòng tin nhắn ngắn cạnh tách trà',
        'Thời điểm phù hợp': 'Anytime',
        'Chủ đề': 'Tình yêu',
        'TikTok Caption':
          'Người lớn ai cũng bận trăm việc, người luôn có năm phút rảnh cho bạn thực ra đang ưu tiên bạn đấy.\n\n#tranguoi #noilai #danvanphong #thathinh',
        'Trạng thái dùng': 'Sẵn sàng dùng',
      },
    },
    {
      code: 'W063',
      fields: {
        ID: 'W063',
        'Kiểu chơi chữ': '1 - Nói lái / Đảo âm',
        'Cặp khóa / Mô-típ': 'Cầu mình cận ↔ Cần mình cậu',
        'Hạt nhân gốc':
          'Tớ thường cầu mình cận, vì tớ chỉ cần mình cậu (VOH Online & BlogAnChoi)',
        'Nội dung Trà Nguội':
          'Ngồi đối diện bên bàn trà, đôi lúc chỉ muốn cầu mình cận thêm chút nữa.\nĐể cả phố xá ngoài kia nhòe đi hết… mắt chỉ nhìn rõ và cần mình cậu thôi.',
        'Pivot Word (Đỏ Chu Sa)': 'cần mình cậu',
        'Đạo cụ sân khấu':
          'Cặp kính gọng mảnh đặt xuống mặt bàn gỗ → Phố xá phía sau mờ nhẹ, chỉ còn bóng người đối diện rõ nét',
        'Thời điểm phù hợp': 'Anytime',
        'Chủ đề': 'Tình yêu',
        'TikTok Caption':
          'Giữa dòng người đông đúc ngoài kia, mắt chỉ tự động lấy nét đúng một người ngồi trước mặt. ☕\n\n#tranguoi #noilai #thathinh #tinhyeu',
        'Trạng thái dùng': 'Sẵn sàng dùng',
      },
    },
    {
      code: 'W064',
      fields: {
        ID: 'W064',
        'Kiểu chơi chữ': '1 - Nói lái / Đảo âm',
        'Cặp khóa / Mô-típ': 'Thấy người yếu ↔ Thiếu người ấy',
        'Hạt nhân gốc':
          'Dạo này thấy người hơi yếu / Chắc là tại thiếu người ấy (VOH Online & FPT Shop)',
        'Nội dung Trà Nguội':
          'Sáng nay pha ấm trà đặc mà vẫn thấy người yếu lạ thường.\nBắt mạch hồi lâu mới biết… chẳng phải cảm nắng, chỉ là thiếu người ấy ngồi cùng.',
        'Pivot Word (Đỏ Chu Sa)': 'thiếu người ấy',
        'Đạo cụ sân khấu':
          'Ấm trà nóng rót đầy tách sứ trắng → Ánh mắt ngước sang chỗ ngồi quen thuộc còn để trống',
        'Thời điểm phù hợp': 'Morning',
        'Chủ đề': 'Tình yêu',
        'TikTok Caption':
          'Triệu chứng này uống bao nhiêu trà gừng cũng không bớt, phải gặp đúng người mới khỏe lại ngay. 🍵\n\n#tranguoi #noilai #trasang #thathinh',
        'Trạng thái dùng': 'Sẵn sàng dùng',
      },
    },
    {
      code: 'W065',
      fields: {
        ID: 'W065',
        'Kiểu chơi chữ': '1 - Nói lái / Đảo âm',
        'Cặp khóa / Mô-típ': 'Cai vì nghiện ↔ Kiêng vì ngại',
        'Hạt nhân gốc':
          'Trà sữa em phải cai vì nghiện / Còn anh, em phải kiêng vì ngại (VOH Online & BlogAnChoi)',
        'Nội dung Trà Nguội':
          'Cà phê chiều cố tập cai vì nghiện mất ngủ.\nCòn ánh mắt một người ở dãy bàn đối diện… đành dặn lòng kiêng vì ngại nhìn lâu.',
        'Pivot Word (Đỏ Chu Sa)': 'kiêng vì ngại',
        'Đạo cụ sân khấu':
          'Ly cà phê đẩy nhẹ sang một bên thay bằng tách trà → Ánh mắt lén nhìn qua vách bàn rồi khẽ cúi xuống',
        'Thời điểm phù hợp': 'Anytime',
        'Chủ đề': 'Tình yêu',
        'TikTok Caption':
          'Cai đồ uống có caffein còn dễ, chứ bảo đừng liếc sang bàn người mình thích sao khó giữ lời thế không biết. 😅\n\n#tranguoi #noilai #danvanphong #yeutham',
        'Trạng thái dùng': 'Sẵn sàng dùng',
      },
    },
    {
      code: 'W066',
      fields: {
        ID: 'W066',
        'Kiểu chơi chữ': '1 - Nói lái / Đảo âm',
        'Cặp khóa / Mô-típ': 'Nhường nàng thơ ↔ Nhờ nàng thương',
        'Hạt nhân gốc':
          'Bao điều tốt đẹp, ta nhường nàng thơ. Chỉ cần đáp lại, mong nhờ nàng thương (BlogAnChoi)',
        'Nội dung Trà Nguội':
          'Bao nhiêu chỗ đẹp bên khung cửa nắng xin nhường nàng thơ ngồi trước.\nTôi chỉ giữ ghế đối diện châm trà… với chút lòng riêng mong nhờ nàng thương.',
        'Pivot Word (Đỏ Chu Sa)': 'nhờ nàng thương',
        'Đạo cụ sân khấu':
          'Chiếc ghế gỗ bên khung cửa đầy nắng được kéo sẵn → Ấm trà nghiêng rót làn nước ấm sang chén đối diện',
        'Thời điểm phù hợp': 'Anytime',
        'Chủ đề': 'Tình yêu',
        'TikTok Caption':
          'Sự tinh tế của người trưởng thành đôi khi chỉ là dành sẵn góc nắng đẹp nhất cho người mình để ý. 🍵\n\n#tranguoi #noilai #quantra #thathinh',
        'Trạng thái dùng': 'Sẵn sàng dùng',
      },
    },
    {
      code: 'W067',
      fields: {
        ID: 'W067',
        'Kiểu chơi chữ': '1 - Nói lái / Đảo âm',
        'Cặp khóa / Mô-típ': 'Vốn tính lười ↔ Vướng lưới tình',
        'Hạt nhân gốc':
          'Tính lười một chút mà lại dính lưới tình người mắc (VOH Online & FPT Shop)',
        'Nội dung Trà Nguội':
          'Cuối tuần vốn sẵn tính lười, chẳng mấy khi chịu bước chân ra phố.\nVậy mà ai kia vừa rủ đi uống trà… đã tự nguyện vướng ngay vào lưới tình.',
        'Pivot Word (Đỏ Chu Sa)': 'lưới tình',
        'Đạo cụ sân khấu':
          'Người đang nằm dài đọc sách bên hiên nhà → Bật dậy chỉnh lại cổ áo bước nhanh ra ngõ',
        'Thời điểm phù hợp': 'Anytime',
        'Chủ đề': 'Tình yêu',
        'TikTok Caption':
          'Bình thường ai rủ cũng viện cớ bận nghỉ ngơi, trừ đúng một người nhắn lúc nào cũng rảnh. 😄\n\n#tranguoi #noilai #cuoituan #tinhyeu',
        'Trạng thái dùng': 'Sẵn sàng dùng',
      },
    },
    {
      code: 'W068',
      fields: {
        ID: 'W068',
        'Kiểu chơi chữ': '1 - Nói lái / Đảo âm',
        'Cặp khóa / Mô-típ': 'Hơi rối em nhờ ↔ Đã nhớ em rồi',
        'Hạt nhân gốc':
          'Rối em nhờ – nhớ em rồi (VOH Online, FPT Shop & Phong Vũ Tech News)',
        'Nội dung Trà Nguội':
          'Gió đầu ngày thổi ngang hiên làm trang sách hơi rối em nhờ.\nMà thực ra trang sách chẳng lộn xộn mấy đâu… chỉ tại mới sáng ra đã nhớ em rồi.',
        'Pivot Word (Đỏ Chu Sa)': 'nhớ em rồi',
        'Đạo cụ sân khấu':
          'Gió sớm lật nhẹ trang sách mở trên bàn trà → Ngón tay dừng lại bên dòng chữ đang đọc dở',
        'Thời điểm phù hợp': 'Morning',
        'Chủ đề': 'Tình yêu',
        'TikTok Caption':
          'Đổ lỗi cho cơn gió sớm làm xao nhãng trang sách, chứ tâm trí bay đi đâu thì tự mình rõ nhất. ☕\n\n#tranguoi #noilai #trasang #nhonhung',
        'Trạng thái dùng': 'Sẵn sàng dùng',
      },
    },
    {
      code: 'W069',
      fields: {
        ID: 'W069',
        'Kiểu chơi chữ': '1 - Nói lái / Đảo âm',
        'Cặp khóa / Mô-típ': 'Ráng giàu cùng nha ↔ Bình yên già cùng nhau',
        'Hạt nhân gốc':
          'Anh ơi sau này mình giàu cùng nha. Già cùng nhau! (BlogAnChoi)',
        'Nội dung Trà Nguội':
          'Tuổi trẻ chăm chỉ đi làm, hay đùa sau này hai đứa ráng giàu cùng nha.\nĐi qua bao mùa nắng mưa mới hiểu… lời chúc đẹp nhất vẫn là bình yên già cùng nhau.',
        'Pivot Word (Đỏ Chu Sa)': 'già cùng nhau',
        'Đạo cụ sân khấu':
          'Hai người trẻ sóng bước buổi sáng → Hóa thành hai mái đầu bạc thong thả thưởng trà bên hiên',
        'Thời điểm phù hợp': 'Morning',
        'Chủ đề': 'Tình yêu',
        'TikTok Caption':
          'Đi qua hết những vội vàng mưu sinh, điều quý giá nhất vẫn là còn người ngồi uống trà sáng cùng mình nhiều năm nữa. 🍵\n\n#tranguoi #noilai #binhyen #triky',
        'Trạng thái dùng': 'Sẵn sàng dùng',
      },
    },
    {
      code: 'W070',
      fields: {
        ID: 'W070',
        'Kiểu chơi chữ': '1 - Nói lái / Đảo âm',
        'Cặp khóa / Mô-típ': 'Se lạnh nhớ ai ↔ Lại nhớ anh',
        'Hạt nhân gốc':
          'Lạnh nhớ ai – lại nhớ anh (Phong Vũ Tech News)',
        'Nội dung Trà Nguội':
          'Gió đầu mùa lùa qua khung cửa, tự hỏi trời se lạnh nhớ ai.\nƯớp ấm hai bàn tay bên tách trà nóng… mới nhận ra mình lại nhớ anh.',
        'Pivot Word (Đỏ Chu Sa)': 'lại nhớ anh',
        'Đạo cụ sân khấu':
          'Chiếc khăn choàng mỏng khẽ bay bên bệ cửa gió sớm → Đôi bàn tay ấp quanh chén trà nóng bốc khói',
        'Thời điểm phù hợp': 'Morning',
        'Chủ đề': 'Tình yêu',
        'TikTok Caption':
          'Cứ mỗi đợt gió heo may chớm về lúc sáng sớm là lòng người lại tự động tìm cớ nhớ một cái tên. 🍂\n\n#tranguoi #noilai #giomua #tinhyeu',
        'Trạng thái dùng': 'Sẵn sàng dùng',
      },
    },
    {
      code: 'W071',
      fields: {
        ID: 'W071',
        'Kiểu chơi chữ': '1 - Nói lái / Đảo âm',
        'Cặp khóa / Mô-típ': 'Ong thật liều ↔ Yêu thật lòng',
        'Hạt nhân gốc':
          'Vì mật mà ong thật liều, vì anh mà yêu thật lòng (VOH Online, FPT Shop & BlogAnChoi)',
        'Nội dung Trà Nguội':
          'Thấy hoa nở bên giậu mà chú ong thật liều bay qua nắng gắt.\nGiống hệt người vốn tính dè dặt… gặp đúng ánh mắt hiền bỗng hóa yêu thật lòng.',
        'Pivot Word (Đỏ Chu Sa)': 'yêu thật lòng',
        'Đạo cụ sân khấu':
          'Chú ong nhỏ đậu lên nhành hoa bên hiên nắng → Chén trà đặt ngay ngắn cạnh nhành hoa đỏ chu sa',
        'Thời điểm phù hợp': 'Anytime',
        'Chủ đề': 'Tình yêu',
        'TikTok Caption':
          'Người càng thận trọng trong chuyện tình cảm, tới lúc rung động thật sự lại càng chân thành hơn ai hết.\n\n#tranguoi #noilai #chanthanh #tinhyeu',
        'Trạng thái dùng': 'Sẵn sàng dùng',
      },
    },
    {
      code: 'W072',
      fields: {
        ID: 'W072',
        'Kiểu chơi chữ': '1 - Nói lái / Đảo âm',
        'Cặp khóa / Mô-típ': 'Yếu tiếng Trung ↔ Trúng tiếng yêu',
        'Hạt nhân gốc':
          'Yếu tiếng Trung – trúng tiếng yêu (VOH Online, FPT Shop & Phong Vũ Tech News)',
        'Nội dung Trà Nguội':
          'Đăng ký học ngoại ngữ mãi mà vẫn tự nhận mình yếu tiếng Trung.\nChắc tại mải nhìn sang bàn bên cạnh… nên lỡ trúng tiếng yêu lúc nào chẳng hay.',
        'Pivot Word (Đỏ Chu Sa)': 'trúng tiếng yêu',
        'Đạo cụ sân khấu':
          'Cuốn sổ từ vựng mở trên bàn gỗ → Nét bút mực tàu vô thức vẽ hình nhành hoa nhỏ ở góc trang',
        'Thời điểm phù hợp': 'Anytime',
        'Chủ đề': 'Tình yêu',
        'TikTok Caption':
          'Từ mới hôm nay chưa kịp thuộc chữ nào, nhưng nụ cười bàn kế bên thì nhớ rõ từng nét. 😄\n\n#tranguoi #noilai #thathinh #haihuoc',
        'Trạng thái dùng': 'Sẵn sàng dùng',
      },
    },
  ],
};
