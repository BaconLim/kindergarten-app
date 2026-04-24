// ==========================================
// 幼兒園聯絡簿後端 API - 多校隔離 (Multi-tenant) 版本
// ==========================================

// 【你需手動修改這裡】請把三間學校的 Google 試算表 ID 填入
const DB_MAP = {
  "sankuaicuo": "1ESBQqYLprfkhiBNvlrztjZBneYXJXF3Lyfyg1qmZzu4", 
  "ziqiang": "1AKzHrzrkpVBIO_WK_XURxpKMRGqkTc2q-MjvLHC9m_0",
  "fengshan": "1clRqbM7bs6Gu52lDfoXXZW5ypFcB7g0TLusVTm-Qsvo"
};

function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    const payload = postData.payload || {};
    
    // 從請求中提取 Token 並解析出歸屬的學校 (登入請求沒有 Token，會自己傳 Username)
    let tokenData = null;
    if (postData.token) {
        let b64Str = postData.token.split('.')[1];
        // 修正 Base64 Padding 問題
        b64Str = b64Str.replace(/-/g, '+').replace(/_/g, '/');
        while (b64Str.length % 4) { b64Str += '='; }
        
        const decodedString = Utilities.newBlob(Utilities.base64Decode(b64Str)).getDataAsString();
        tokenData = JSON.parse(decodedString);
    }

    let responseData = {};

    switch (action) {
      case 'login':
        responseData = handleLogin(payload);
        break;
      case 'get_my_students':
        responseData = getMyStudents(tokenData);
        break;
      case 'create_book':
        responseData = createContactBook(payload, tokenData);
        break;
      case 'get_reviews':
        responseData = getPendingReviews(tokenData);
        break;
      case 'publish_book':
        responseData = publishBook(payload, tokenData);
        break;
      case 'publish_all_books':
        responseData = publishAllBooks(payload, tokenData);
        break;
      case 'delete_book':
        responseData = deleteBook(payload, tokenData);
        break;
      case 'get_teacher_books':
        responseData = getTeacherBooks(tokenData);
        break;
      case 'get_student_books':
        responseData = getStudentBooks(payload, tokenData);
        break;
      case 'reply_book':
        responseData = replyBook(payload, tokenData);
        break;
      default:
        throw new Error("未知的動作請求 (Unknown action)");
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      data: responseData
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 幫助函數：尋找指定 ID 試算表內的工作表
function getSheetData(sheetId, sheetName) {
  const sheet = SpreadsheetApp.openById(sheetId).getSheetByName(sheetName);
  if (!sheet) throw new Error(`找不到工作表: ${sheetName}`);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0];
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    obj._rowNumber = i + 1;
    rows.push(obj);
  }
  return rows;
}

function handleLogin(payload) {
  // 要求帳號必須以 schoolId_ 開頭，例如：schoolA_teacher_01
  const username = payload.username || "";
  const prefixParts = username.split('_');
  if (prefixParts.length < 2) throw new Error("帳號格式錯誤，必須包含學校前綴（例：schoolA_xxx）");
  
  const schoolId = prefixParts[0];
  const sheetId = DB_MAP[schoolId];
  if (!sheetId) throw new Error(`無效的學校代碼: ${schoolId}`);

  const users = getSheetData(sheetId, "Users");
  const user = users.find(u => u.username == username && u.password == payload.password);
  if (!user) throw new Error("帳號或密碼錯誤");
  
  // 將權限欄位封裝進 Token
  const tokenPayload = { 
    sub: user.username, 
    role: user.role, 
    school_id: schoolId,
    managed_class: user.managed_class || "",
    child_student_id: user.child_student_id ? String(user.child_student_id) : ""
  };
  
  // 使用 UTF-8 進行 Base64 編碼，完美解決中文「蘋果班」變成亂碼的問題
  const payloadStr = JSON.stringify(tokenPayload);
  const mockToken = "gas." + Utilities.base64EncodeWebSafe(payloadStr, Utilities.Charset.UTF_8) + ".signature";
  
  return {
    access_token: mockToken,
    token_type: "bearer"
  };
}

function createContactBook(payload, tokenData) {
  if (!tokenData) throw new Error("權限不足");
  const sheetId = DB_MAP[tokenData.school_id];
  const sheet = SpreadsheetApp.openById(sheetId).getSheetByName("ContactBooks");
  const newId = new Date().getTime(); // 簡單用時間戳當作 ID
  const today = payload.date || new Date().toISOString().split('T')[0];
  
  // 寫入: id, student_id, date, content, status, parent_reply
  sheet.appendRow([
    newId,
    payload.student_id,
    today,
    payload.content,
    "pending_review",
    ""
  ]);
  
  return { id: newId, status: "pending_review" };
}

// 輔助函式：聯接 Student 資料取得姓名與班級
function attachStudentInfo(sheetId, books) {
  const students = getSheetData(sheetId, "Students");
  return books.map(book => {
    const stu = students.find(s => s.id == book.student_id);
    return {
      ...book,
      student_name: stu ? stu.name : '未知學生',
      class_name: stu ? stu.class_name : '未指定班級'
    };
  });
}

function getPendingReviews(tokenData) {
  if (!tokenData) throw new Error("權限不足");
  const sheetId = DB_MAP[tokenData.school_id];
  const books = getSheetData(sheetId, "ContactBooks");
  
  let pendingBooks = books.filter(b => b.status === "pending_review");
  pendingBooks.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  return attachStudentInfo(sheetId, pendingBooks);
}

function publishBook(payload, tokenData) {
  if (!tokenData) throw new Error("權限不足");
  const sheetId = DB_MAP[tokenData.school_id];
  const sheet = SpreadsheetApp.openById(sheetId).getSheetByName("ContactBooks");
  const books = getSheetData(sheetId, "ContactBooks");
  
  const book = books.find(b => b.id == payload.book_id);
  if (!book) throw new Error("找不到該聯絡簿");
  if (book.status !== "pending_review") throw new Error("狀態錯誤，無法發布");
  
  const headers = sheet.getDataRange().getValues()[0];
  const statusCol = headers.indexOf('status') + 1;
  sheet.getRange(book._rowNumber, statusCol).setValue("published");
  
  return { id: book.id, status: "published" };
}

function publishAllBooks(payload, tokenData) {
  if (!tokenData || tokenData.role !== 'admin') throw new Error("權限不足");
  if (!payload.book_ids || !Array.isArray(payload.book_ids)) throw new Error("無效的資料格式");
  
  const sheetId = DB_MAP[tokenData.school_id];
  const sheet = SpreadsheetApp.openById(sheetId).getSheetByName("ContactBooks");
  const headers = sheet.getDataRange().getValues()[0];
  const statusCol = headers.indexOf('status') + 1;
  const data = sheet.getDataRange().getValues();
  
  let count = 0;
  for (let i = 1; i < data.length; i++) {
    // payload.book_ids contains strings or numbers, data is maybe different type, use ==
    if (payload.book_ids.some(id => id == data[i][0]) && data[i][headers.indexOf('status')] === "pending_review") {
      sheet.getRange(i + 1, statusCol).setValue("published");
      count++;
    }
  }
  
  return { message: `批次發布成功 (${count} 筆)` };
}

function deleteBook(payload, tokenData) {
  if (!tokenData || tokenData.role !== 'admin') throw new Error("權限不足");
  
  const sheetId = DB_MAP[tokenData.school_id];
  const sheet = SpreadsheetApp.openById(sheetId).getSheetByName("ContactBooks");
  const books = getSheetData(sheetId, "ContactBooks");
  
  const book = books.find(b => b.id == payload.book_id);
  if (!book) throw new Error("找不到該聯絡簿");
  
  const headers = sheet.getDataRange().getValues()[0];
  const statusCol = headers.indexOf('status') + 1;
  sheet.getRange(book._rowNumber, statusCol).setValue("deleted");
  
  return { message: "刪除成功" };
}

function getStudentBooks(payload, tokenData) {
  if (!tokenData) throw new Error("權限不足");
  if (tokenData.role !== 'parent') throw new Error("只有家長可以呼叫此功能");
  if (!tokenData.child_student_id) throw new Error("家長帳戶未綁定學生");
  
  const sheetId = DB_MAP[tokenData.school_id];
  const books = getSheetData(sheetId, "ContactBooks");
  const valid_statuses = ["published", "replied", "closed"]; 
  
  let myBooks = books.filter(b => 
    b.student_id == tokenData.child_student_id && 
    valid_statuses.includes(b.status)
  );
  myBooks.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  return attachStudentInfo(sheetId, myBooks);
}

function getMyStudents(tokenData) {
  if (!tokenData) throw new Error("權限不足");
  if (tokenData.role !== 'teacher') throw new Error("只有老師可以呼叫此功能");
  if (!tokenData.managed_class) throw new Error("老師帳戶未綁定班級");
  
  const sheetId = DB_MAP[tokenData.school_id];
  const students = getSheetData(sheetId, "Students");
  
  // 如果使用者有建立 Classes 工作表，就嘗試撈取中文名稱對照表
  let classes = [];
  try {
    classes = getSheetData(sheetId, "Classes");
  } catch (e) {
    // 忽略，可能還沒建
  }
  
  return students
    .filter(s => s.class_id == tokenData.managed_class || s.class_name == tokenData.managed_class)
    .map(s => {
      // 嘗試進行關聯 (JOIN) 取得中文班級名稱
      const classInfo = classes.find(c => c.class_id === s.class_id || c.class_id === s.class_name);
      return {
        ...s,
        display_class_name: classInfo ? classInfo.class_name : (s.class_id || s.class_name)
      };
    });
}

function replyBook(payload, tokenData) {
  if (!tokenData) throw new Error("權限不足");
  const sheetId = DB_MAP[tokenData.school_id];
  const sheet = SpreadsheetApp.openById(sheetId).getSheetByName("ContactBooks");
  const books = getSheetData(sheetId, "ContactBooks");
  
  const book = books.find(b => b.id == payload.book_id);
  
  if (!book) throw new Error("找不到該聯絡簿");
  if (book.status === "replied") throw new Error("此聯絡簿已經回覆過，無法再次修改。");
  if (book.status !== "published") throw new Error("狀態錯誤，目前尚未發佈或已結案。");
  
  const headers = sheet.getDataRange().getValues()[0];
  const statusCol = headers.indexOf('status') + 1;
  const replyCol = headers.indexOf('parent_reply') + 1;
  
  sheet.getRange(book._rowNumber, statusCol).setValue("replied");
  sheet.getRange(book._rowNumber, replyCol).setValue(payload.parent_reply);
  
  return { id: book.id, status: "replied" };
}

function getTeacherBooks(tokenData) {
  if (!tokenData) throw new Error("權限不足");
  if (tokenData.role !== 'teacher') throw new Error("只有老師可以呼叫此功能");
  if (!tokenData.managed_class) throw new Error("老師帳戶未綁定班級");
  
  const sheetId = DB_MAP[tokenData.school_id];
  
  // 1. 取得該老師班上的所有學生 ID
  const students = getSheetData(sheetId, "Students");
  const myStudentIds = students
    .filter(s => s.class_id == tokenData.managed_class || s.class_name == tokenData.managed_class)
    .map(s => String(s.id));
    
  // 2. 取得聯絡簿
  const books = getSheetData(sheetId, "ContactBooks");
  
  // 3. 過濾出屬於該班級學生，且狀態不是 deleted 的聯絡簿
  // 老師可以看 pending_review (自己剛發), published (園長已審), replied (家長已回)
  let myBooks = books.filter(b => 
    myStudentIds.includes(String(b.student_id)) && 
    b.status !== "deleted"
  );
  
  myBooks.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // 加入姓名與班級
  return attachStudentInfo(sheetId, myBooks);
}
