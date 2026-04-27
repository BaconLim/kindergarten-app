import { useState, useEffect } from 'react';
import { api } from '../contexts/AuthContext';

function Profile() {
  const [profile, setProfile] = useState({
    nickname: '', birthday: '', gender: '男', diseases: '', care_notes: '',
    parent_name: '', parent_relation: '', phone: '', address: '',
    emerg_name: '', emerg_relation: '', emerg_phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.post('', { action: 'get_profiles' });
      if (res.data.status === 'success' && res.data.data.length > 0) setProfile(res.data.data[0]);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('', { action: 'save_profile', payload: profile });
      setMsg('✅ 儲存成功！');
    } catch (err) { setMsg('❌ 儲存失敗'); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6 pb-20">
      <h2 className="text-xl font-bold text-center">小孩基本資料</h2>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-md space-y-6">
        {msg && <div className="p-3 bg-indigo-50 text-indigo-700 rounded-lg text-center font-bold">{msg}</div>}
        <section className="space-y-3">
          <h3 className="font-bold border-b pb-2 text-indigo-600">👶 孩童資訊</h3>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="小名" className="p-2 border rounded" value={profile.nickname} onChange={e => setProfile({...profile, nickname: e.target.value})} />
            <select className="p-2 border rounded" value={profile.gender} onChange={e => setProfile({...profile, gender: e.target.value})}>
              <option value="男">男</option><option value="女">女</option>
            </select>
          </div>
          <input type="date" className="w-full p-2 border rounded" value={profile.birthday} onChange={e => setProfile({...profile, birthday: e.target.value})} />
          <input placeholder="特殊疾病/過敏" className="w-full p-2 border rounded text-red-600" value={profile.diseases} onChange={e => setProfile({...profile, diseases: e.target.value})} />
          <textarea placeholder="照顧叮嚀" className="w-full p-2 border rounded" value={profile.care_notes} onChange={e => setProfile({...profile, care_notes: e.target.value})} />
        </section>
        
        <section className="space-y-3">
          <h3 className="font-bold border-b pb-2 text-indigo-600">👨‍👩‍👧 家長聯絡人</h3>
          <input placeholder="姓名" className="w-full p-2 border rounded" value={profile.parent_name} onChange={e => setProfile({...profile, parent_name: e.target.value})} />
          <input placeholder="關係" className="w-full p-2 border rounded" value={profile.parent_relation} onChange={e => setProfile({...profile, parent_relation: e.target.value})} />
          <input placeholder="電話" className="w-full p-2 border rounded" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} />
          <input placeholder="住址" className="w-full p-2 border rounded" value={profile.address} onChange={e => setProfile({...profile, address: e.target.value})} />
        </section>

        <section className="space-y-3">
          <h3 className="font-bold border-b pb-2 text-red-600">🚨 緊急聯絡人</h3>
          <input placeholder="姓名" className="w-full p-2 border rounded" value={profile.emerg_name} onChange={e => setProfile({...profile, emerg_name: e.target.value})} />
          <input placeholder="關係" className="w-full p-2 border rounded" value={profile.emerg_relation} onChange={e => setProfile({...profile, emerg_relation: e.target.value})} />
          <input placeholder="電話" className="w-full p-2 border rounded" value={profile.emerg_phone} onChange={e => setProfile({...profile, emerg_phone: e.target.value})} />
        </section>

        <button disabled={loading} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg">儲存基本資料</button>
      </form>
    </div>
  );
}

export default Profile;
