import { useState, useEffect } from 'react';
import { api } from '../contexts/AuthContext';

function AdminTemplate() {
  const [template, setTemplate] = useState({ course_content: '', other_announcements: '' });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [msg, setMsg] = useState('');

  const fetchTemplate = async () => {
    try {
      setFetching(true);
      const res = await api.post('', { action: 'get_template' });
      if (res.data.status === 'success') setTemplate(res.data.data);
    } catch (e) { 
      console.error(e); 
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchTemplate();
  }, []);

  const handleSaveTemplate = async () => {
    try {
      setLoading(true);
      setMsg('');
      const res = await api.post('', { action: 'save_template', payload: template });
      if (res.data.status === 'success') {
        setMsg('✅ 公版內容已更新並套用至全校教師！');
      }
    } catch (e) {
      setMsg('❌ 更新公版失敗');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="text-center mt-10 text-gray-500">載入中...</div>;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6 pb-20">
      <h2 className="text-xl font-bold text-center">全校公版內容設定</h2>
      
      <div className="bg-white p-6 rounded-2xl shadow-md space-y-6">
        <p className="text-sm text-gray-500 font-bold border-l-4 border-indigo-400 pl-3">
          此處設定的內容將自動派發給所有老師，作為他們填寫聯絡簿時的預設版型。
        </p>

        {msg && <div className="p-3 bg-indigo-50 text-indigo-700 rounded-lg text-center font-bold">{msg}</div>}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">A. 課程內容分享 (Course Content)</label>
            <textarea 
              className="w-full p-3 border border-indigo-200 rounded-xl text-sm focus:ring focus:ring-indigo-200" rows="6" 
              value={template.course_content} 
              onChange={e => setTemplate({...template, course_content: e.target.value})}
              placeholder="請輸入本週/本日的課程內容..."
            />
          </div>
          
          <div className="opacity-50 pointer-events-none">
            <label className="block text-sm font-bold text-gray-700 mb-1">B. 孩子個別表現 (由各班老師填寫)</label>
            <textarea className="w-full p-3 border border-gray-200 bg-gray-50 rounded-xl text-sm" rows="2" placeholder="(老師將在此處輸入個別學生的表現)" disabled />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">C. 其他注意事項 (Other Announcements)</label>
            <textarea 
              className="w-full p-3 border border-indigo-200 rounded-xl text-sm focus:ring focus:ring-indigo-200" rows="4" 
              value={template.other_announcements} 
              onChange={e => setTemplate({...template, other_announcements: e.target.value})}
              placeholder="例如：請記得帶水壺、本週五穿運動服..."
            />
          </div>
        </div>

        <button onClick={handleSaveTemplate} disabled={loading} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg disabled:opacity-50">
          {loading ? '儲存中...' : '儲存並派發'}
        </button>
      </div>
    </div>
  );
}

export default AdminTemplate;
