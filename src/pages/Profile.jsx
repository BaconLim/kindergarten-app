import { useState, useEffect } from 'react';
import { api, useAuth } from '../contexts/AuthContext';

function Profile() {
  const { userRole } = useAuth();
  const [profile, setProfile] = useState({
    nickname: '', birthday: '', gender: '男', diseases: '', care_notes: '',
    parent_name: '', parent_relation: '', phone: '', address: '',
    emerg_name: '', emerg_relation: '', emerg_phone: ''
  });
  
  // 老師專用狀態
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  // UI 狀態
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [msg, setMsg] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [sameAsParent, setSameAsParent] = useState(false);

  useEffect(() => {
    if (userRole === 'teacher') {
      fetchTeacherStudents();
    } else {
      fetchProfile();
    }
  }, [userRole]);

  useEffect(() => {
    if (userRole === 'teacher' && selectedStudentId) {
      fetchProfile(selectedStudentId);
    }
  }, [selectedStudentId]);

  const fetchTeacherStudents = async () => {
    try {
      const res = await api.post('', { action: 'get_my_students' });
      if (res.data.status === 'success') {
        setStudents(res.data.data);
      }
    } catch (err) { console.error(err); }
  };

  const fetchProfile = async (targetStudentId = null) => {
    try {
      setFetchingData(true);
      setMsg('');
      setIsEditing(false); // 讀取新資料時關閉編輯模式
      const payload = targetStudentId ? { student_id: targetStudentId } : {};
      const res = await api.post('', { action: 'get_profiles', payload });
      if (res.data.status === 'success' && res.data.data.length > 0) {
        setProfile(res.data.data[0]);
      } else {
        setProfile({
          nickname: '', birthday: '', gender: '男', diseases: '', care_notes: '',
          parent_name: '', parent_relation: '', phone: '', address: '',
          emerg_name: '', emerg_relation: '', emerg_phone: ''
        });
      }
    } catch (err) { console.error(err); }
    finally { setFetchingData(false); }
  };

  const handleSameAsParentToggle = (e) => {
    const checked = e.target.checked;
    setSameAsParent(checked);
    if (checked) {
      setProfile(prev => ({
        ...prev,
        emerg_name: prev.parent_name,
        emerg_relation: prev.parent_relation,
        emerg_phone: prev.phone
      }));
    }
  };

  const executeSave = async () => {
    setLoading(true);
    try {
      const payload = userRole === 'teacher' ? { student_id: selectedStudentId, ...profile } : profile;
      await api.post('', { action: 'save_profile', payload });
      setMsg('✅ 儲存成功！');
      setIsEditing(false); // 存檔完畢恢復鎖定模式
    } catch (err) { setMsg('❌ 儲存失敗'); }
    finally { setLoading(false); }
  };

  const handleSaveClick = (e) => {
    e.preventDefault();
    if (!isEditing) {
      setIsEditing(true);
      setMsg('');
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: '確認更新',
      message: '是否確認更新基本資料？',
      onConfirm: () => executeSave()
    });
  };

  const showForm = userRole === 'parent' || (userRole === 'teacher' && selectedStudentId);

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6 pb-20">
      <h2 className="text-xl font-bold text-center">
        {userRole === 'teacher' ? '學生基本資料管理' : '小孩基本資料'}
      </h2>

      {userRole === 'teacher' && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <label className="block text-sm font-bold text-indigo-700 mb-2">請選擇學生</label>
          <select 
            className="w-full p-2 border rounded-lg bg-indigo-50 font-bold" 
            value={selectedStudentId} 
            onChange={(e) => setSelectedStudentId(e.target.value)}
          >
            <option value="" disabled>-- 請選擇一位小孩 --</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.display_class_name})</option>
            ))}
          </select>
        </div>
      )}

      {!showForm && userRole === 'teacher' && (
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
          <p className="text-gray-500 font-bold">↑ 請先在上方選擇一位學生，才能查看或編輯他的基本資料</p>
        </div>
      )}

      {showForm && fetchingData && (
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-indigo-100">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent mb-2"></div>
          <p className="text-indigo-600 font-bold">資料讀取中...</p>
        </div>
      )}

      {showForm && !fetchingData && (
      <form className={`bg-white p-6 rounded-2xl shadow-md space-y-6 transition-all ${isEditing ? 'border-2 border-indigo-300' : 'border border-gray-100 opacity-90'}`}>
        {msg && <div className="p-3 bg-indigo-50 text-indigo-700 rounded-lg text-center font-bold">{msg}</div>}
        
        {!isEditing && (
          <div className="p-3 bg-yellow-50 text-yellow-700 rounded-lg text-xs font-bold flex items-center justify-center border border-yellow-200">
            🔒 瀏覽模式 (點擊下方「更改基本資料」按鈕解鎖)
          </div>
        )}

        <section className="space-y-3">
          <h3 className="font-bold border-b pb-2 text-indigo-600">👶 孩童資訊</h3>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="小名" disabled={!isEditing} className={`p-2 border rounded ${!isEditing && 'bg-gray-50'}`} value={profile.nickname} onChange={e => setProfile({...profile, nickname: e.target.value})} />
            <select disabled={!isEditing} className={`p-2 border rounded ${!isEditing && 'bg-gray-50'}`} value={profile.gender} onChange={e => setProfile({...profile, gender: e.target.value})}>
              <option value="男">男</option><option value="女">女</option>
            </select>
          </div>
          <input type="date" disabled={!isEditing} className={`w-full p-2 border rounded ${!isEditing && 'bg-gray-50'}`} value={profile.birthday} onChange={e => setProfile({...profile, birthday: e.target.value})} />
          <input placeholder="特殊疾病/過敏" disabled={!isEditing} className={`w-full p-2 border rounded text-red-600 ${!isEditing && 'bg-gray-50'}`} value={profile.diseases} onChange={e => setProfile({...profile, diseases: e.target.value})} />
          <textarea placeholder="照顧叮嚀" disabled={!isEditing} className={`w-full p-2 border rounded resize-y ${!isEditing && 'bg-gray-50'}`} rows="6" value={profile.care_notes} onChange={e => setProfile({...profile, care_notes: e.target.value})} />
        </section>
        
        <section className="space-y-3">
          <h3 className="font-bold border-b pb-2 text-indigo-600">👨‍👩‍👧 家長聯絡人</h3>
          <input placeholder="姓名" disabled={!isEditing} className={`w-full p-2 border rounded ${!isEditing && 'bg-gray-50'}`} value={profile.parent_name} onChange={e => setProfile({...profile, parent_name: e.target.value})} />
          <input placeholder="關係" disabled={!isEditing} className={`w-full p-2 border rounded ${!isEditing && 'bg-gray-50'}`} value={profile.parent_relation} onChange={e => setProfile({...profile, parent_relation: e.target.value})} />
          <input placeholder="電話" disabled={!isEditing} className={`w-full p-2 border rounded ${!isEditing && 'bg-gray-50'}`} value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} />
          <input placeholder="住址" disabled={!isEditing} className={`w-full p-2 border rounded ${!isEditing && 'bg-gray-50'}`} value={profile.address} onChange={e => setProfile({...profile, address: e.target.value})} />
        </section>

        <section className="space-y-3">
          <div className="flex justify-between items-end border-b pb-2">
            <h3 className="font-bold text-red-600">🚨 緊急聯絡人</h3>
            {isEditing && (
              <label className="flex items-center space-x-1 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded cursor-pointer">
                <input type="checkbox" checked={sameAsParent} onChange={handleSameAsParentToggle} className="w-3 h-3" />
                <span>同上 (帶入家長資料)</span>
              </label>
            )}
          </div>
          <input placeholder="姓名" disabled={!isEditing || sameAsParent} className={`w-full p-2 border rounded ${(!isEditing || sameAsParent) && 'bg-gray-50'}`} value={profile.emerg_name} onChange={e => setProfile({...profile, emerg_name: e.target.value})} />
          <input placeholder="關係" disabled={!isEditing || sameAsParent} className={`w-full p-2 border rounded ${(!isEditing || sameAsParent) && 'bg-gray-50'}`} value={profile.emerg_relation} onChange={e => setProfile({...profile, emerg_relation: e.target.value})} />
          <input placeholder="電話" disabled={!isEditing || sameAsParent} className={`w-full p-2 border rounded ${(!isEditing || sameAsParent) && 'bg-gray-50'}`} value={profile.emerg_phone} onChange={e => setProfile({...profile, emerg_phone: e.target.value})} />
        </section>

        <button type="button" onClick={handleSaveClick} disabled={loading || (userRole === 'teacher' && !selectedStudentId)} className={`w-full py-3 rounded-xl font-bold shadow-lg transition-colors ${isEditing ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white'}`}>
          {loading ? '處理中...' : (isEditing ? '儲存基本資料' : '更改基本資料')}
        </button>
      </form>
      )}

      {/* 客製化確認彈窗 */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{confirmDialog.title}</h3>
            <p className="text-gray-600 mb-6">{confirmDialog.message}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDialog({ isOpen: false })} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold">否 (繼續編輯)</button>
              <button onClick={() => {
                confirmDialog.onConfirm();
                setConfirmDialog({ isOpen: false });
              }} className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold">確認更新</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
