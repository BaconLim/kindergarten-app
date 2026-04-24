import httpx

base_url = "http://localhost:8000"

def run_simulation():
    client = httpx.Client(base_url=base_url)
    
    print("--- 1. 建立帳號 ---")
    users = [
        {"username": "teacher_01", "password": "password", "role": "teacher"},
        {"username": "admin_01", "password": "password", "role": "admin"},
        {"username": "parent_01", "password": "password", "role": "parent"}
    ]
    for u in users:
        r = client.post("/users/", json=u)
        print(f"建立 {u['username']}:", r.status_code)
        
    print("\n--- 2. 取得 Token ---")
    teacher_token = client.post("/login/access-token", data={"username": "teacher_01", "password": "password"}).json()["access_token"]
    admin_token = client.post("/login/access-token", data={"username": "admin_01", "password": "password"}).json()["access_token"]
    parent_token = client.post("/login/access-token", data={"username": "parent_01", "password": "password"}).json()["access_token"]
    
    print("\n--- 3. 教師撰寫聯絡簿草稿 ---")
    headers_teacher = {"Authorization": f"Bearer {teacher_token}"}
    r = client.post("/contact-books/", json={
        "student_id": 1,
        "date": "2026-03-11",
        "content": "小明今天在學校摔倒了，但學校經過專業的醫療後，小明康復的很快，家長可以幫我檢查他的狀況。"
    }, headers=headers_teacher)
    
    if r.status_code != 200:
        print(f"Error {r.status_code}: {r.text}")
    book_id = r.json()["id"]
    print(f"教師建立成功, 狀態: {r.json()['status']}, 內容: {r.json()['content']}")
    
    print("\n--- 4. 園長審核並發布 ---")
    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    r = client.get("/contact-books/review", headers=headers_admin)
    print("園長看到的待審核清單數量:", len(r.json()))
    
    r = client.put(f"/contact-books/{book_id}/publish", headers=headers_admin)
    print(f"園長發布成功, 新狀態: {r.json()['status']}")
    
    print("\n--- 5. 家長查閱與回覆 ---")
    headers_parent = {"Authorization": f"Bearer {parent_token}"}
    r = client.get("/contact-books/student/1", headers=headers_parent)
    print("家長查到的聯絡簿數量:", len(r.json()), "內容:", r.json()[0]['content'])
    
    r = client.put(f"/contact-books/{book_id}/reply", json={
        "parent_reply": "我問過小明，他說自己不小心摔倒，現在身體很健康，學校的醫療非常完整。"
    }, headers=headers_parent)
    print(f"家長首次回覆成功, 新狀態: {r.json()['status']}, 回覆內容: {r.json()['parent_reply']}")
    
    print("\n--- 6. 防呆機制：家長嘗試第二次回覆 ---")
    r = client.put(f"/contact-books/{book_id}/reply", json={
        "parent_reply": "我想補充說幾句話..."
    }, headers=headers_parent)
    print(f"家長重複回覆被拒絕, HTTP Code: {r.status_code}, 原因: {r.json()['detail']}")

if __name__ == "__main__":
    run_simulation()
