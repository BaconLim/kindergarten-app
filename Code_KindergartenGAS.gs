/**
 * 幼兒園電子聯絡簿 - 真相大白版 (GAS 後端)
 * 依照真實 Excel 關聯結構 (managed_class, child_student_id) 重建連動邏輯
 */

const DB_MAP = {
  "sankuaicuo": "1ESBQqYLprfkhiBNvlrztjZBneYXJXF3Lyfyg1qmZzu4", 
  "ziqiang": "1AKzHrzrkpVBIO_WK_XURxpKMRGqkTc2q-MjvLHC9m_0",
  "fengshan": "1clRqbM7bs6Gu52lDfoXXZW5ypFcB7g0TLusVTm-Qsvo"
};

function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents);
    const { action, payload, token } = request;
    
    if (action === 'login') return response(handleLogin(payload));

    const userData = verifyToken(token);
    if (!userData) return response({ status: 'error', message: '登入失敗或已過期' });
    
    const school = userData.school;

    switch (action) {
      case 'get_reviews': return response(handleGetReviews(school));
      case 'get_student_books': return response(handleGetStudentBooks(school, userData.student_id));
      case 'get_teacher_books': return response(handleGetTeacherBooks(school, userData.managed_class));
      case 'get_my_students': return response(handleGetMyStudents(school, userData.managed_class));
      case 'create_book': return response(handleCreateBook(school, payload));
      case 'create_books_batch': return response(handleCreateBooksBatch(school, payload));
      case 'publish_book': return response(handlePublishBook(school, payload));
      case 'publish_all_books': return response(handlePublishAllBooks(school, payload));
      case 'edit_book': return response(handleEditBook(school, payload));
      case 'delete_book': return response(handleDeleteBook(school, payload));
      case 'reply_book': return response(handleReplyBook(school, payload));
      case 'get_profiles': return response(handleGetProfiles(school, payload?.student_id || userData.student_id));
      case 'save_profile': return response(handleSaveProfile(school, payload?.student_id || userData.student_id, payload));
      default: return response({ status: 'error', message: '未知行動' });
    }
  } catch (err) {
    return response({ status: 'error', message: err.toString() });
  }
}

// --- 核心邏輯 ---

function handleLogin(payload) {
  const { username, password } = payload;
  for (let key in DB_MAP) {
    try {
      const users = getSheetData(DB_MAP[key], 'Users');
      const user = users.find(u => u.username == username && u.password == password);
      
      if (user) {
        const token = Utilities.base64Encode(JSON.stringify({
          username: user.username, 
          role: user.role, 
          school: key, 
          student_id: user.child_student_id, // 家長專用
          managed_class: user.managed_class, // 老師專用
          exp: new Date().getTime() + 86400000
        }));
        return { status: 'success', data: { access_token: "eyJhbGci." + token + ".signature" } };
      }
    } catch(e) { continue; }
  }
  return { status: 'error', message: '帳號或密碼錯誤' };
}

function verifyToken(token) {
  if (!token) return null;
  try {
    const parts = token.split('.');
    const b64 = parts.length > 1 ? parts[1].trim() : token.trim();
    const decoded = JSON.parse(Utilities.newBlob(Utilities.base64Decode(b64)).getDataAsString());
    if (new Date().getTime() > decoded.exp) return null;
    return decoded;
  } catch(e) { return null; }
}

function getSheetData(ssId, sheetName) {
  const sheet = SpreadsheetApp.openById(ssId).getSheetByName(sheetName);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  return data.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

// --- 老師與學生資料連動 ---

function handleGetMyStudents(school, managedClass) {
  const students = getSheetData(DB_MAP[school], 'Students');
  // 過濾出負責班級的學生，並加上前端需要的 display_class_name
  const myStudents = students
    .filter(s => s.class_name == managedClass)
    .map(s => ({ ...s, display_class_name: s.class_name }));
  return { status: 'success', data: myStudents };
}

function handleGetTeacherBooks(school, managedClass) {
  const books = getSheetData(DB_MAP[school], 'ContactBooks');
  const students = getSheetData(DB_MAP[school], 'Students');
  
  // 1. 找出該班級所有的學生 ID
  const myStudentIds = students.filter(s => s.class_name == managedClass).map(s => String(s.id));
  
  // 2. 過濾聯絡簿，並補上前端需要的 student_name
  const myBooks = books
    .filter(b => myStudentIds.includes(String(b.student_id)))
    .map(b => {
      const stu = students.find(s => String(s.id) == String(b.student_id));
      return { ...b, student_name: stu ? stu.name : '未知學生' };
    });
    
  return { status: 'success', data: myBooks.reverse() };
}

function handleGetStudentBooks(school, studentId) {
  const books = getSheetData(DB_MAP[school], 'ContactBooks');
  const students = getSheetData(DB_MAP[school], 'Students');
  
  const myBooks = books
    .filter(b => String(b.student_id) == String(studentId) && b.status === 'published')
    .map(b => {
      const stu = students.find(s => String(s.id) == String(b.student_id));
      return { ...b, student_name: stu ? stu.name : '未知學生' };
    });
    
  return { status: 'success', data: myBooks.reverse() };
}

function handleGetReviews(school) {
  const books = getSheetData(DB_MAP[school], 'ContactBooks');
  const students = getSheetData(DB_MAP[school], 'Students');
  
  const pendingBooks = books
    .filter(b => b.status === 'pending_review')
    .map(b => {
      const stu = students.find(s => String(s.id) == String(b.student_id));
      return { 
        ...b, 
        student_name: stu ? stu.name : '未知學生',
        class_name: stu ? stu.class_name : '未指定班級',
        display_class_name: stu ? stu.class_name : '未指定班級'
      };
    });
    
  return { status: 'success', data: pendingBooks };
}

function handleCreateBook(school, payload) {
  const ss = SpreadsheetApp.openById(DB_MAP[school]);
  const sheet = ss.getSheetByName('ContactBooks');
  const headers = sheet.getDataRange().getValues()[0];
  const newRow = headers.map(h => {
    if (h === 'id') return new Date().getTime();
    if (h === 'date') return new Date();
    if (h === 'student_id') return payload.student_id;
    if (h === 'content') return payload.content;
    if (h === 'status') return 'pending_review';
    if (h === 'parent_reply') return '';
    return '';
  });
  sheet.appendRow(newRow);
  return { status: 'success' };
}

function handleCreateBooksBatch(school, payload) {
  if (payload.student_ids && Array.isArray(payload.student_ids)) {
    payload.student_ids.forEach(sid => handleCreateBook(school, { student_id: sid, content: payload.content }));
  }
  return { status: 'success' };
}

function handlePublishBook(school, payload) {
  updateStatus(school, 'ContactBooks', payload.book_id, 'published');
  return { status: 'success' };
}

function handlePublishAllBooks(school, payload) {
  if (payload.book_ids && Array.isArray(payload.book_ids)) {
    payload.book_ids.forEach(id => updateStatus(school, 'ContactBooks', id, 'published'));
  }
  return { status: 'success' };
}

function handleEditBook(school, payload) {
  const ss = SpreadsheetApp.openById(DB_MAP[school]);
  const sheet = ss.getSheetByName('ContactBooks');
  const data = sheet.getDataRange().getValues();
  const idCol = data[0].indexOf('id');
  const contentCol = data[0].indexOf('content');
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(payload.book_id)) {
      sheet.getRange(i + 1, contentCol + 1).setValue(payload.content);
      return { status: 'success' };
    }
  }
  return { status: 'error' };
}

function handleDeleteBook(school, payload) {
  const ss = SpreadsheetApp.openById(DB_MAP[school]);
  const sheet = ss.getSheetByName('ContactBooks');
  const data = sheet.getDataRange().getValues();
  const idCol = data[0].indexOf('id');
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(payload.book_id)) {
      sheet.deleteRow(i + 1);
      return { status: 'success' };
    }
  }
  return { status: 'error' };
}

function handleReplyBook(school, payload) {
  const ss = SpreadsheetApp.openById(DB_MAP[school]);
  const sheet = ss.getSheetByName('ContactBooks');
  const data = sheet.getDataRange().getValues();
  const idCol = data[0].indexOf('id');
  const replyCol = data[0].indexOf('parent_reply');
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(payload.book_id)) {
      sheet.getRange(i + 1, replyCol + 1).setValue(payload.parent_reply);
      return { status: 'success' };
    }
  }
  return { status: 'error' };
}

function handleGetProfiles(school, studentId) {
  const profiles = getSheetData(DB_MAP[school], 'StudentProfiles');
  return { status: 'success', data: profiles.filter(p => p.student_id == studentId) };
}

function handleSaveProfile(school, studentId, payload) {
  const ss = SpreadsheetApp.openById(DB_MAP[school]);
  let sheet = ss.getSheetByName('StudentProfiles');
  if (!sheet) {
    sheet = ss.insertSheet('StudentProfiles');
    sheet.appendRow(['student_id', 'nickname', 'birthday', 'gender', 'diseases', 'care_notes', 'parent_name', 'parent_relation', 'phone', 'address', 'emerg_name', 'emerg_relation', 'emerg_phone']);
  }
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const stuIdCol = headers.indexOf('student_id');
  let rowIdx = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][stuIdCol] == studentId) { rowIdx = i + 1; break; }
  }
  const newRow = headers.map(h => payload[h] || (h === 'student_id' ? studentId : ''));
  if (rowIdx !== -1) sheet.getRange(rowIdx, 1, 1, headers.length).setValues([newRow]);
  else sheet.appendRow(newRow);
  return { status: 'success' };
}

function updateStatus(school, sheetName, id, status) {
  const ss = SpreadsheetApp.openById(DB_MAP[school]);
  const sheet = ss.getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  const idCol = data[0].indexOf('id');
  const statusCol = data[0].indexOf('status');
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(id)) {
      sheet.getRange(i + 1, statusCol + 1).setValue(status);
      break;
    }
  }
}

function response(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
