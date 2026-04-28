/**
 * 幼兒園電子聯絡簿 - 終極完全體 (穩定版)
 * 包含：萬能登入、標題自適應、園長/老師/家長全功能
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
      case 'publish_book': return response(handlePublishBook(school, payload));
      case 'publish_all_books': return response(handlePublishAllBooks(school, payload));
      case 'edit_book': return response(handleEditBook(school, payload));
      case 'delete_book': return response(handleDeleteBook(school, payload));
      case 'get_my_students': return response(handleGetMyStudents(school, userData.username));
      case 'get_teacher_books': return response(handleGetTeacherBooks(school, userData.username));
      case 'create_book': return response(handleCreateBook(school, userData.username, payload));
      case 'create_books_batch': return response(handleCreateBooksBatch(school, userData.username, payload));
      case 'get_student_books': return response(handleGetStudentBooks(school, userData.student_id));
      case 'reply_book': return response(handleReplyBook(school, payload));
      case 'get_profiles': return response(handleGetProfiles(school, userData.student_id));
      case 'save_profile': return response(handleSaveProfile(school, userData.student_id, payload));
      default: return response({ status: 'error', message: '未知行動：' + action });
    }
  } catch (err) {
    return response({ status: 'error', message: "系統錯誤: " + err.toString() });
  }
}

// --- 登入與驗證 ---

function handleLogin(payload) {
  const { username, password } = payload;
  if (username === 'admin' && password === 'admin') {
    return { status: 'success', data: { access_token: createToken('管理員', 'admin', 'sankuaicuo', null) } };
  }

  for (let key in DB_MAP) {
    try {
      const users = getSheetData(DB_MAP[key], 'Users');
      const user = users.find(u => {
        const uName = u.username || u.Username || u['帳號'] || u['使用者名稱'];
        const uPass = u.password || u.Password || u['密碼'];
        return String(uName).trim() === String(username).trim() && String(uPass).trim() === String(password).trim();
      });
      
      if (user) {
        const role = user.role || user.Role || user['身分'] || 'parent';
        const stuId = user.student_id || user.Student_ID || user['學生ID'] || null;
        return { status: 'success', data: { access_token: createToken(username, role, key, stuId) } };
      }
    } catch(e) { continue; }
  }
  return { status: 'error', message: '帳號或密碼錯誤' };
}

function createToken(username, role, school, studentId) {
  const payload = { username, role, school, student_id: studentId, exp: new Date().getTime() + 86400000 };
  const base64 = Utilities.base64Encode(JSON.stringify(payload));
  return "eyJhbGci. " + base64 + ".signature";
}

function verifyToken(token) {
  try {
    const parts = token.split('.');
    const b64 = parts[1].trim();
    const decoded = JSON.parse(Utilities.newBlob(Utilities.base64Decode(b64)).getDataAsString());
    return (new Date().getTime() > decoded.exp) ? null : decoded;
  } catch(e) { return null; }
}

// --- 資料讀取與處理 ---

function getSheetData(ssId, sheetName) {
  const ss = SpreadsheetApp.openById(ssId);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim().toLowerCase().replace(/\s+/g, '_'));
  return data.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function handleGetReviews(school) {
  const books = getSheetData(DB_MAP[school], 'ContactBooks');
  return { status: 'success', data: books.filter(b => b.status === 'pending_review') };
}

function handlePublishBook(school, payload) {
  updateStatus(school, 'ContactBooks', payload.book_id, 'published');
  return { status: 'success' };
}

function handlePublishAllBooks(school, payload) {
  payload.book_ids.forEach(id => updateStatus(school, 'ContactBooks', id, 'published'));
  return { status: 'success' };
}

function handleEditBook(school, payload) {
  const ss = SpreadsheetApp.openById(DB_MAP[school]);
  const sheet = ss.getSheetByName('ContactBooks');
  const data = sheet.getDataRange().getValues();
  const idCol = data[0].map(h => String(h).toLowerCase()).indexOf('id');
  const contentCol = data[0].map(h => String(h).toLowerCase()).indexOf('content');
  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] == payload.book_id) {
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
  const idCol = data[0].map(h => String(h).toLowerCase()).indexOf('id');
  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] == payload.book_id) {
      sheet.deleteRow(i + 1);
      return { status: 'success' };
    }
  }
  return { status: 'error' };
}

function handleGetMyStudents(school, username) {
  const students = getSheetData(DB_MAP[school], 'Students');
  return { status: 'success', data: students.filter(s => s.teacher_username == username) };
}

function handleGetTeacherBooks(school, username) {
  const books = getSheetData(DB_MAP[school], 'ContactBooks');
  return { status: 'success', data: books.filter(b => b.teacher_username == username).reverse() };
}

function handleCreateBook(school, username, payload) {
  const ss = SpreadsheetApp.openById(DB_MAP[school]);
  const sheet = ss.getSheetByName('ContactBooks');
  const headers = sheet.getDataRange().getValues()[0];
  const newRow = headers.map(h => {
    const key = String(h).toLowerCase();
    if (key === 'id') return new Date().getTime();
    if (key === 'date') return new Date();
    if (key === 'teacher_username') return username;
    if (key === 'student_id') return payload.student_id;
    if (key === 'content') return payload.content;
    if (key === 'status') return 'pending_review';
    return '';
  });
  sheet.appendRow(newRow);
  return { status: 'success' };
}

function handleCreateBooksBatch(school, username, payload) {
  payload.student_ids.forEach(sid => handleCreateBook(school, username, { student_id: sid, content: payload.content }));
  return { status: 'success' };
}

function handleGetStudentBooks(school, studentId) {
  const books = getSheetData(DB_MAP[school], 'ContactBooks');
  return { status: 'success', data: books.filter(b => b.student_id == studentId && b.status === 'published').reverse() };
}

function handleReplyBook(school, payload) {
  const ss = SpreadsheetApp.openById(DB_MAP[school]);
  const sheet = ss.getSheetByName('ContactBooks');
  const data = sheet.getDataRange().getValues();
  const idCol = data[0].map(h => String(h).toLowerCase()).indexOf('id');
  const replyCol = data[0].map(h => String(h).toLowerCase()).indexOf('parent_reply');
  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] == payload.book_id) {
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
  const idCol = data[0].map(h => String(h).toLowerCase()).indexOf('id');
  const statusCol = data[0].map(h => String(h).toLowerCase()).indexOf('status');
  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] == id) {
      sheet.getRange(i + 1, statusCol + 1).setValue(status);
      break;
    }
  }
}

function response(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.JSON);
}
