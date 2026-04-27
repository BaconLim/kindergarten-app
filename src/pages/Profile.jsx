import { useState, useEffect } from 'react';
import { api } from '../contexts/AuthContext';
import { useAuth } from '../contexts/AuthContext';

function Profile() {
  const { userRole } = useAuth();
  const [profile, setProfile] = useState({
    nickname: '', birthday: '', gender: '男', diseases: '', care_notes: '',
    parent_name: '', parent_relation: '', phone: '', address: '',
    emerg_name: '', emerg_relation: '', emerg_phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  // Teacher state
  const [teacherProfiles, setTeacherProfiles] = useState([]);
  
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await api.post('', { action: 'get_profiles' });
      if (response.data.status === 'success') {
        if (userRole === 'parent') {
          if (response.data.data.length > 0) {
            setProfile(response.data.data[0]);
          }
        } else if (userRole === 'teacher') {
          setTeacherProfiles(response.data.data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const response = await api.post('', {
        action: 'save_profile',
        payload: profile
      });
      if (response.data.status === 'success') {
        setMessage('儲存成功！老師已能看到最新資料。');
      } else {
        setMessage('儲存失敗：' + response.data.message);
      }
    } catch (err) {
      setMessage('發生錯誤，請稍後再試。');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center mt-10 text-gray-500">載入中...</div>;

  if (userRole === 'teacher') {
    return (
      <div className="space-y-4 max-w-lg mx-auto flex flex-col w-full">
        <h2 className="text-xl font-bold text-gray-800 text-center">班級學生基本資料</h2>
        {teacherProfiles.length === 0 ? (
          <div className="text-center text-gray-400 py-8 bg-white rounded-xl shadow-sm">尚無家長填寫資料</div>
        ) : (
          <div className="space-y-4">
            {teacherProfiles.map(p => (
              <div key={p.student_id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <div className="font-bold text-lg text-indigo-700 mb-3 border-b pb-2">{p.student_name} <span className="text-sm text-gray-500 font-normal">({p.nickname})</span></div>
                
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="text-gray-500">性別：<span className="text-gray-800">{p.gender}</span></div>
                  <div className="text-gray-500">生日：<span className="text-gray-800">{p.birthday}</span></div>
                  <div className="col-span-2 text-gray-500">特殊疾病：<span className="text-red-600 font-medium">{p.diseases || '無'}</span></div>
                  <div className="col-span-2 text-gray-500">照顧叮嚀：<span className="text-gray-800">{p.care_notes || '無'}</span></div>
                  
                  <div className="col-span-2 mt-2 pt-2 border-t border-gray-50 font-semibold text-gray-700">家長聯絡人</div>
                  <div className="col-span-2 text-gray-500">姓名：<span className="text-gray-800">{p.parent_name} ({p.parent_relation})</span></div>
                  <div className="col-span-2 text-gray-500">電話：<a href={`tel:${p.phone}`} className="text-indigo-600 font-medium">{p.phone}</a></div>
                  <div className="col-span-2 text-gray-500">地址：<span className="text-gray-800">{p.address}</span></div>
                  
                  <div className="col-span-2 mt-2 pt-2 border-t border-red-50 font-semibold text-red-700">緊急聯絡人</div>
                  <div className="text-gray-500">姓名：<span className="text-gray-800">{p.emerg_name} ({p.emerg_relation})</span></div>
                  <div className="text-gray-500">電話：<a href={`tel:${p.emerg_phone}`} className="text-red-600 font-medium">{p.emerg_phone}</a></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto flex flex-col w-full">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-800">基本資料設定</h2>
        <p className="text-gray-500 text-sm">填寫後老師即可在系統中查看</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-6">
        {message && (
          <div className={`p-3 rounded-lg text-sm text-center ${message.includes('成功') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        {/* 孩童資料 */}
        <div>
          <h3 className="font-bold text-indigo-700 border-b pb-2 mb-3">👶 孩童基本資料</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">小名</label>
                <input type="text" name="nickname" value={profile.nickname} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">性別</label>
                <select name="gender" value={profile.gender} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="男">男</option>
                  <option value="女">女</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">生日 (西元年)</label>
              <input type="date" name="birthday" value={profile.birthday} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-red-400 mb-1">特殊疾病 / 過敏史</label>
              <input type="text" name="diseases" value={profile.diseases} onChange={handleChange} className="w-full px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-sm focus:ring-2 focus:ring-red-400 outline-none" placeholder="例如：蠶豆症、對花生過敏..." />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">照顧叮嚀</label>
              <textarea name="care_notes" value={profile.care_notes} onChange={handleChange} rows="2" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" placeholder="例如：吃飯比較慢，請老師多包涵"></textarea>
            </div>
          </div>
        </div>

        {/* 家長資料 */}
        <div>
          <h3 className="font-bold text-indigo-700 border-b pb-2 mb-3">👨‍👩‍👧 家長聯絡資料</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">家長姓名</label>
                <input type="text" name="parent_name" value={profile.parent_name} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">關係 (如: 爸爸)</label>
                <input type="text" name="parent_relation" value={profile.parent_relation} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">聯絡電話</label>
              <input type="tel" name="phone" value={profile.phone} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">居住地址</label>
              <input type="text" name="address" value={profile.address} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>
        </div>

        {/* 緊急聯絡人 */}
        <div>
          <h3 className="font-bold text-red-600 border-b border-red-100 pb-2 mb-3">🚨 緊急聯絡人 (非上述家長)</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">姓名</label>
                <input type="text" name="emerg_name" value={profile.emerg_name} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">關係 (如: 奶奶)</label>
                <input type="text" name="emerg_relation" value={profile.emerg_relation} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">聯絡電話</label>
              <input type="tel" name="emerg_phone" value={profile.emerg_phone} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={saving}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md transition disabled:opacity-50"
        >
          {saving ? '儲存中...' : '儲存資料'}
        </button>
      </form>
    </div>
  );
}

export default Profile;
