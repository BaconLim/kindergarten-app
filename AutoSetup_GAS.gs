function autoSetupDatabases() {
  const schoolNames = ["蘋果幼兒園 (School A)", "香蕉幼兒園 (School B)", "芭樂幼兒園 (School C)"];
  const ids = [];

  for (let i = 0; i < schoolNames.length; i++) {
    // 1. 建立新的試算表
    let ss = SpreadsheetApp.create(schoolNames[i] + " - 聯絡簿資料庫");
    ids.push(ss.getId());
    
    // 2. 建立三個工作表並設定標題
    let sheetUsers = ss.insertSheet("Users");
    sheetUsers.appendRow(["id", "username", "password", "role"]);
    // 預設寫入這間學校的超級園長帳號
    sheetUsers.appendRow(["1", `school${String.fromCharCode(65+i)}_admin`, "123456", "admin"]);
    
    let sheetStudents = ss.insertSheet("Students");
    sheetStudents.appendRow(["id", "name", "class_name"]);
    sheetStudents.appendRow(["1", "測試學生", "蘋果班"]);
    
    let sheetBooks = ss.insertSheet("ContactBooks");
    sheetBooks.appendRow(["id", "student_id", "date", "content", "status", "parent_reply"]);
    
    // 刪除預設多餘的 "工作表1"
    let defaultSheet = ss.getSheetByName("工作表1");
    if (defaultSheet) ss.deleteSheet(defaultSheet);
  }

  // 3. 印出結果給使用者
  const dbMapCode = `
// 請複製這段貼回你的 Code_KindergartenGAS.gs 的最上面！
const DB_MAP = {
  "schoolA": "${ids[0]}",
  "schoolB": "${ids[1]}",
  "schoolC": "${ids[2]}"
};
  `;
  
  Logger.log("🎉 建立成功！請去你的 Google 雲端硬碟查看三個新的試算表。");
  Logger.log("👇 下面是你專屬的路由表代碼：");
  Logger.log(dbMapCode);
}
