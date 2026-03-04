import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { Loader2, Save, Sparkles, Upload, Link as LinkIcon, Copy, Table, X, Check } from 'lucide-react';

export default function App() {
  // Block 1 State
  const [premise, setPremise] = useState('');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);

  // Extra fields for Supabase based on screenshot
  const [idAds, setIdAds] = useState('');
  const [direction, setDirection] = useState('fitness');
  const [role, setRole] = useState('marketolog');

  // Block 2 State
  const [variants, setVariants] = useState({
    A: { head_land: '', text_land: '' },
    B: { head_land: '', text_land: '' },
    C: { head_land: '', text_land: '' },
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Table State
  const [isTableOpen, setIsTableOpen] = useState(false);
  const [savedAds, setSavedAds] = useState<any[]>([]);
  const [isLoadingTable, setIsLoadingTable] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleOpenTable = async () => {
    setIsTableOpen(true);
    setIsLoadingTable(true);
    try {
      const { data, error } = await supabase
        .from('fitbase_ads_content')
        .select('id_ads, variation_ads, head_land, text_land, direction, role');
      if (error) throw error;
      setSavedAds(data || []);
    } catch (error: any) {
      console.error('Error fetching ads:', error);
      setMessage({ text: 'Ошибка при загрузке данных таблицы', type: 'error' });
    } finally {
      setIsLoadingTable(false);
    }
  };

  const handleCopyFromTable = (ad: any, index: number, utmContent: string) => {
    const url = `https://fitbase.it/?utm_content=${utmContent}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(`${ad.id_ads}-${index}`);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  const handleGenerate = async () => {
    if (!premise || !title || !text) {
      setMessage({ text: 'Заполните Посыл, Заголовок и Текст в Блоке 1', type: 'error' });
      return;
    }

    setIsGenerating(true);
    setMessage({ text: '', type: '' });

    let fileContent = '';
    let imageBase64 = '';
    if (file) {
      if (file.type === 'text/plain') {
        try {
          fileContent = await file.text();
        } catch (e) {
          console.error('Error reading file', e);
        }
      } else if (file.type.startsWith('image/')) {
        try {
          const reader = new FileReader();
          imageBase64 = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        } catch (e) {
          console.error('Error reading image', e);
        }
      }
    }

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ premise, title, text, fileContent, imageBase64 }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate variants');
      }

      const data = await response.json();
      setVariants({
        A: { head_land: data.A?.head_land || '', text_land: data.A?.text_land || '' },
        B: { head_land: data.B?.head_land || '', text_land: data.B?.text_land || '' },
        C: { head_land: data.C?.head_land || '', text_land: data.C?.text_land || '' },
      });
      setMessage({ text: 'Варианты успешно сгенерированы!', type: 'success' });
    } catch (error) {
      console.error(error);
      setMessage({ text: 'Ошибка при генерации вариантов', type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!idAds) {
      setMessage({ text: 'Укажите ID (id_ads) для сохранения', type: 'error' });
      return;
    }

    setIsSaving(true);
    setMessage({ text: '', type: '' });

    try {
      // Prepare data for Supabase
      // We save 3 rows, one for each variant A, B, C
      const rowsToInsert = ['A', 'B', 'C'].map((variation) => ({
        id_ads: idAds,
        variation_ads: variation,
        head_ads: title,
        text_ads: text,
        head_land: variants[variation as keyof typeof variants].head_land,
        text_land: variants[variation as keyof typeof variants].text_land,
        direction: direction,
        role: role,
      }));

      // Assuming table name is 'fitbase_ads_content' based on the screenshot
      const { error } = await supabase.from('fitbase_ads_content').insert(rowsToInsert);

      if (error) {
        throw error;
      }

      setMessage({ text: 'Данные успешно сохранены в Supabase!', type: 'success' });
    } catch (error: any) {
      console.error(error);
      setMessage({ text: `Ошибка при сохранении: ${error.message}`, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleVariantChange = (variant: 'A' | 'B' | 'C', field: 'head_land' | 'text_land', value: string) => {
    setVariants((prev) => ({
      ...prev,
      [variant]: {
        ...prev[variant],
        [field]: value,
      },
    }));
  };

  const handleCopyLink = (variant: 'A' | 'B' | 'C') => {
    if (!idAds || !role || !direction) {
      setMessage({ text: 'Для формирования ссылки заполните Идентификатор объявления, Роль и Направление в Блоке 1', type: 'error' });
      return;
    }
    
    // Формируем ссылку: fitbase.it/?utm_content={идентификаторобъявления}_{вариантобъявления}_{роль}_{направление}
    const url = `https://fitbase.it/?utm_content=${idAds}_${variant}_${role}_${direction}`;
    
    navigator.clipboard.writeText(url).then(() => {
      setMessage({ text: `Ссылка для варианта ${variant} скопирована в буфер обмена!`, type: 'success' });
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      setMessage({ text: 'Ошибка при копировании ссылки', type: 'error' });
    });
  };

  return (
    <div className="h-screen bg-zinc-50 p-4 font-sans text-zinc-900 overflow-hidden flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex flex-col h-full">
        <header className="mb-4 flex-shrink-0 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Генератор вариантов посадочных страниц</h1>
            <p className="text-zinc-500 text-sm mt-1">Создавайте варианты заголовков и текстов с помощью AI</p>
          </div>
          <button
            onClick={handleOpenTable}
            className="flex items-center gap-2 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 px-4 py-2 rounded-xl font-medium transition-all shadow-sm text-sm"
          >
            <Table className="w-4 h-4" />
            База вариантов
          </button>
        </header>

        {message.text && (
          <div className={`p-3 rounded-xl mb-4 flex-shrink-0 text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
          {/* Block 1 */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-zinc-200 flex flex-col h-full">
            <h2 className="text-lg font-semibold border-b border-zinc-100 pb-3 mb-4 flex-shrink-0">Блок 1: Исходные данные</h2>
            
            <div className="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Идентификатор объявления для UTM_CONTENT</label>
                <input
                  type="text"
                  value={idAds}
                  onChange={(e) => setIdAds(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-zinc-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="Например: AdsMKTanalist"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Направление (direction)</label>
                  <input
                    type="text"
                    value={direction}
                    onChange={(e) => setDirection(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-zinc-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Роль (role)</label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-zinc-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Посыл</label>
                <textarea
                  value={premise}
                  onChange={(e) => setPremise(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-zinc-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                  placeholder="Опишите основной посыл..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Заголовок (head_ads)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-zinc-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="Введите заголовок рекламы..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Текст (text_ads)</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-zinc-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                  placeholder="Введите текст рекламы..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Загрузить файл (картинка или текст)</label>
                <div className="mt-1 flex justify-center px-4 py-3 border-2 border-zinc-300 border-dashed rounded-lg hover:border-indigo-400 transition-colors bg-zinc-50">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-6 w-6 text-zinc-400" />
                    <div className="flex text-xs text-zinc-600 justify-center">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 px-2 py-0.5">
                        <span>Загрузить файл</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                      </label>
                    </div>
                    <p className="text-[10px] text-zinc-500">PNG, JPG, TXT до 10MB</p>
                    {file && <p className="text-xs font-medium text-indigo-600 mt-1 truncate max-w-[200px] mx-auto">Выбран файл: {file.name}</p>}
                  </div>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-4 flex-shrink-0 text-sm"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isGenerating ? 'Генерация...' : 'Сгенерировать варианты'}
            </button>
          </div>

          {/* Block 2 */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-zinc-200 flex flex-col h-full">
            <h2 className="text-lg font-semibold border-b border-zinc-100 pb-3 mb-4 flex-shrink-0">Блок 2: Варианты на странице</h2>
            
            <div className="space-y-4 overflow-y-auto flex-1 pr-2 custom-scrollbar">
              {(['A', 'B', 'C'] as const).map((variant) => (
                <div key={variant} className="space-y-3 p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-sm text-indigo-900 flex items-center gap-2">
                      <span className="bg-indigo-100 text-indigo-800 w-6 h-6 rounded-md flex items-center justify-center text-xs">{variant}</span>
                      Вариант
                    </h3>
                    <button
                      onClick={() => handleCopyLink(variant)}
                      className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition-colors border border-indigo-100"
                      title="Скопировать UTM-ссылку"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      Скопировать ссылку
                    </button>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">Заголовок на странице (head_land)</label>
                    <input
                      type="text"
                      value={variants[variant].head_land}
                      onChange={(e) => handleVariantChange(variant, 'head_land', e.target.value)}
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-zinc-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
                      placeholder={`Сгенерированный заголовок ${variant}...`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">Текст на странице (text_land)</label>
                    <textarea
                      value={variants[variant].text_land}
                      onChange={(e) => handleVariantChange(variant, 'text_land', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-zinc-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white resize-none"
                      placeholder={`Сгенерированный текст ${variant}...`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-4 flex-shrink-0 text-sm"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? 'Сохранение...' : 'Сохранить генерацию'}
            </button>
          </div>
        </div>
      </div>

      {/* Table Modal */}
      {isTableOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-50/95 backdrop-blur-sm flex flex-col animate-in fade-in duration-200">
          <div className="p-6 border-b border-zinc-200 flex justify-between items-center bg-white shadow-sm z-10">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <Table className="w-6 h-6 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-zinc-900">База вариантов</h2>
            </div>
            <button onClick={() => setIsTableOpen(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
              <X className="w-6 h-6 text-zinc-500" />
            </button>
          </div>
          
          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-[1600px] mx-auto">
              {isLoadingTable ? (
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                  <p className="text-zinc-500 font-medium">Загрузка данных из Supabase...</p>
                </div>
              ) : (
                <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-zinc-200">
                  <table className="w-full text-left text-sm text-zinc-600">
                    <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-900">
                      <tr>
                        <th className="px-4 py-4 font-semibold whitespace-nowrap">ID (id_ads)</th>
                        <th className="px-4 py-4 font-semibold whitespace-nowrap">Вариант</th>
                        <th className="px-4 py-4 font-semibold min-w-[250px]">Заголовок (head_land)</th>
                        <th className="px-4 py-4 font-semibold min-w-[300px]">Текст (text_land)</th>
                        <th className="px-4 py-4 font-semibold whitespace-nowrap">Направление</th>
                        <th className="px-4 py-4 font-semibold whitespace-nowrap">Роль</th>
                        <th className="px-4 py-4 font-semibold w-72">UTM Content</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {savedAds.map((ad, idx) => {
                        // Формируем utm_content, пропуская пустые значения
                        const utmContent = [ad.id_ads, ad.variation_ads, ad.role, ad.direction].filter(Boolean).join('_');
                        const isCopied = copiedId === `${ad.id_ads}-${idx}`;
                        
                        return (
                          <tr key={idx} className="hover:bg-zinc-50/80 transition-colors">
                            <td className="px-4 py-3 font-medium text-zinc-900">{ad.id_ads}</td>
                            <td className="px-4 py-3">
                              {ad.variation_ads && (
                                <span className="bg-indigo-100 text-indigo-800 w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold">
                                  {ad.variation_ads}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-zinc-700">{ad.head_land}</td>
                            <td className="px-4 py-3 text-zinc-700">{ad.text_land}</td>
                            <td className="px-4 py-3">
                              <span className="bg-zinc-100 text-zinc-700 px-2 py-1 rounded-md text-xs font-medium">{ad.direction}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="bg-zinc-100 text-zinc-700 px-2 py-1 rounded-md text-xs font-medium">{ad.role}</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2 bg-zinc-50 p-1.5 rounded-lg border border-zinc-200 group hover:border-indigo-200 transition-colors">
                                <span className="truncate flex-1 text-[11px] font-mono text-zinc-600" title={`utm_content=${utmContent}`}>
                                  utm_content={utmContent}
                                </span>
                                <button
                                  onClick={() => handleCopyFromTable(ad, idx, utmContent)}
                                  className="p-1.5 bg-white rounded-md transition-all text-zinc-400 hover:text-indigo-600 shadow-sm border border-zinc-200 hover:border-indigo-300 flex-shrink-0"
                                  title="Скопировать ссылку"
                                >
                                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {savedAds.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-12 text-center text-zinc-500">
                            <div className="flex flex-col items-center justify-center space-y-3">
                              <Table className="w-10 h-10 text-zinc-300" />
                              <p>Нет сохраненных вариантов в базе данных</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
