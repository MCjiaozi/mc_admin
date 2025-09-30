'use client'
import axios from 'axios';
import { useRef, useState } from 'react';
import { useEffect } from 'react';
type Config = {
    id: string;
    apiUrl: string;
    rconHost: string;
    rconPort: string;
    rconPassword: string;
    password: string;
};

const Home = () => {
    // 多配置管理
    const [configs, setConfigs] = useState<Config[]>([]);
    const [selectedConfig, setSelectedConfig] = useState<number | null>(null);
    // 表单初始为空
    const [apiUrl, setApiUrl] = useState('');
    const [rconHost, setRconHost] = useState('');
    const [rconPort, setRconPort] = useState('');
    const [rconPassword, setRconPassword] = useState('');
    const [password, setPassword] = useState('');
    const [authed, setAuthed] = useState(false);
    const [error, setError] = useState('');
    const [command, setCommand] = useState('');
    const [history, setHistory] = useState<Array<{ cmd: string; resp: string }>>([]);
    const [inputRef, setInputRef] = useState<any>(null);
    const [historyIndex, setHistoryIndex] = useState<number | null>(null);
    const historyContainerRef = useRef<HTMLDivElement>(null);
    const getApiUrl = () => {
        if (!apiUrl || apiUrl.trim() === '') return '/api/';
        return apiUrl;
    };
    const sendCommand = async (command: string) => {
        try {
            let url = getApiUrl();
            if (!url.endsWith('/')) url += '/';
            const res = await axios.post(url + 'send-command', {
                command,
                password,
                rconHost,
                rconPort,
                rconPassword
            });
            if (res.data.error) {
                setError(res.data.error);
                setHistory(h => [...h, { cmd: command, resp: `[错误] ${res.data.error}` }]);
                return;
            }
            setHistory(h => [...h, { cmd: command, resp: res.data.data.response }]);
            setTimeout(() => {
                if (historyContainerRef.current) {
                    historyContainerRef.current.scrollTo({
                        top: historyContainerRef.current.scrollHeight,
                        behavior: 'smooth'
                    });
                }
            }, 100);
            setError('');
        } catch (error: any) {
            const errMsg = error.response && error.response.data && error.response.data.error ? error.response.data.error : (error instanceof Error ? error.message : '网络错误或服务器异常');
            setError(errMsg);
            setHistory(h => [...h, { cmd: command, resp: `[错误] ${errMsg}` }]);
        }
    };
    // 新建/保存配置时，id 保持不变或新建
    const handleAuth = () => {
        if (!password) {
            setError('请输入管理密码');
            return;
        }
        let url = getApiUrl();
        if (!url.endsWith('/')) url += '/';
        let configId = selectedConfig !== null && configs[selectedConfig]?.id ? configs[selectedConfig].id : `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const newConfig: Config = {
            id: configId,
            apiUrl,
            rconHost,
            rconPort,
            rconPassword,
            password,
        };
        let newConfigs;
        if (selectedConfig !== null) {
            newConfigs = configs.map((cfg, idx) => idx === selectedConfig ? newConfig : cfg);
        } else {
            newConfigs = [...configs, newConfig];
        }
        localStorage.setItem('mc_admin_configs', JSON.stringify(newConfigs));
        setConfigs(newConfigs);
        axios.post(url + 'auth/login', {
            password,
            rconHost,
            rconPort,
            rconPassword
        }).then(res => {
            if (res.data.error) {
                setError(res.data.error);
                setAuthed(false);
            } else {
                setAuthed(true);
                setError('');
            }
        }).catch((error: any) => {
            const errMsg = error.response && error.response.data && error.response.data.error ? error.response.data.error : (error instanceof Error ? error.message : '网络错误或服务器异常');
            setError(errMsg);
        });
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            // 读取所有配置
            const raw = localStorage.getItem('mc_admin_configs');
            if (raw) {
                try {
                    setConfigs(JSON.parse(raw));
                } catch { }
            }
        }
    }, []);
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-200">
            <div className="max-w-[calc(100vw-20px)] sm:max-w-[80vw] max-h-[calc(100vh-20px)] sm:max-h-[80vh] bg-white rounded-2xl shadow-2xl p-12 flex flex-col gap-4">
                <h1 className="text-3xl font-bold text-center text-purple-700">Minecraft 管理终端</h1>
                {authed && selectedConfig !== null && configs[selectedConfig] && (
                    <div className="text-center text-sm text-gray-400">
                        当前配置：{`${(configs[selectedConfig].apiUrl && configs[selectedConfig].apiUrl.trim()) ? configs[selectedConfig].apiUrl : '/api/'} - ${(configs[selectedConfig].rconHost && configs[selectedConfig].rconHost.trim()) ? configs[selectedConfig].rconHost : '默认'}:${(configs[selectedConfig].rconPort && configs[selectedConfig].rconPort.trim()) ? configs[selectedConfig].rconPort : '默认'}`}
                    </div>
                )}
                {!authed ? (
                    <>
                        {/* 配置选择区 */}
                        <div className="flex gap-2 flex-wrap">
                            {configs.map((cfg, idx) => (
                                <div
                                    key={idx}
                                    className={`p-4 rounded-lg shadow border flex flex-col min-w-[220px] max-w-[320px] bg-white relative cursor-pointer transition hover:shadow-lg ${selectedConfig === idx ? 'border-purple-500' : 'border-gray-200'}`}
                                    onClick={() => {
                                        setSelectedConfig(idx);
                                        setApiUrl(cfg.apiUrl);
                                        setRconHost(cfg.rconHost);
                                        setRconPort(cfg.rconPort);
                                        setRconPassword(cfg.rconPassword);
                                        setPassword(cfg.password);
                                    }}
                                >
                                    <div className="font-bold text-purple-700 pr-8">
                                        {`${(cfg.apiUrl && cfg.apiUrl.trim()) ? cfg.apiUrl : '/api/'} - ${(cfg.rconHost && cfg.rconHost.trim()) ? cfg.rconHost : '默认'}:${(cfg.rconPort && cfg.rconPort.trim()) ? cfg.rconPort : '默认'}`}
                                    </div>
                                    <div className="text-xs text-gray-600">API: {cfg.apiUrl && cfg.apiUrl.trim() ? cfg.apiUrl : '/api/'}</div>
                                    <div className="text-xs text-gray-600">Host: {(cfg.rconHost && cfg.rconHost.trim()) ? cfg.rconHost : '默认'}</div>
                                    <div className="text-xs text-gray-600">Port: {(cfg.rconPort && cfg.rconPort.trim()) ? cfg.rconPort : '默认'}</div>
                                    {/* 密码不展示 */}
                                    <button
                                        className="absolute top-2 right-2 px-2 py-1 rounded bg-red-500 text-white text-xs hover:bg-red-600 cursor-pointer"
                                        onClick={e => {
                                            e.stopPropagation();
                                            const newConfigs = configs.filter((_, i) => i !== idx);
                                            setConfigs(newConfigs);
                                            if (typeof window !== 'undefined') {
                                                localStorage.setItem('mc_admin_configs', JSON.stringify(newConfigs));
                                            }
                                            if (selectedConfig === idx) {
                                                setSelectedConfig(null);
                                                setApiUrl('');
                                                setRconHost('');
                                                setRconPort('');
                                                setRconPassword('');
                                                setPassword('');
                                            }
                                        }}
                                    >删除</button>
                                </div>
                            ))}
                            <div
                                className="p-4 rounded-lg shadow border min-w-[220px] max-w-[320px] bg-green-50 flex flex-col justify-center items-center cursor-pointer hover:bg-green-100"
                                onClick={() => {
                                    setSelectedConfig(null);
                                    setApiUrl('');
                                    setRconHost('');
                                    setRconPort('');
                                    setRconPassword('');
                                    setPassword('');
                                }}
                            >
                                {/* 新建配置卡片显示名称 */}
                                <span className="text-green-600 font-bold text-lg">新建配置</span>
                                <span className="text-xs text-gray-500">点击新建</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 overflow-auto p-1">
                            <label className="text-sm text-gray-600 font-medium">API地址 <span className="text-gray-400 text-xs">（留空则使用本项目API）</span></label>
                            <input
                                type="text"
                                value={apiUrl}
                                onChange={e => setApiUrl(e.target.value)}
                                className="min-w-0 border border-gray-300 rounded-lg px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 box-border"
                                placeholder="如 /api/ 或 http://xxx/api/"
                            />
                            <label className="text-sm text-gray-600 font-medium">管理密码</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') { handleAuth(); } }}
                                className="min-w-0 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 text-gray-700 box-border"
                                placeholder="请输入管理密码..."
                            />
                            <div className="flex flex-col gap-1 mt-2 p-2 rounded bg-gray-50 border border-gray-200">
                                <div className="text-xs text-gray-500">RCON相关配置（留空则使用API服务器默认值）</div>
                                <label className="text-sm text-gray-600 font-medium">RCON Host / Port</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={rconHost}
                                        onChange={e => setRconHost(e.target.value)}
                                        className="min-w-0 border border-gray-300 rounded-lg px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 box-border flex-1"
                                        placeholder="RCON Host"
                                    />
                                    <input
                                        type="text"
                                        value={rconPort}
                                        onChange={e => setRconPort(e.target.value)}
                                        className="min-w-0 border border-gray-300 rounded-lg px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 box-border w-24"
                                        placeholder="Port"
                                    />
                                </div>
                                <label className="text-sm text-gray-600 font-medium">RCON密码</label>
                                <input
                                    type="password"
                                    value={rconPassword}
                                    onChange={e => setRconPassword(e.target.value)}
                                    className="min-w-0 border border-gray-300 rounded-lg px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 box-border"
                                    placeholder="RCON密码"
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleAuth}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 shadow"
                        >
                            登录
                        </button>
                        {/* 导入/导出按钮区 */}
                        <div className="flex gap-3 w-full">
                            <button
                                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold shadow hover:bg-blue-700 transition cursor-pointer border-none"
                                onClick={() => {
                                    if (typeof window !== 'undefined') {
                                        const data = localStorage.getItem('mc_admin_configs') || '[]';
                                        const blob = new Blob([data], { type: 'application/json' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = 'mc_admin_configs.json';
                                        a.click();
                                        URL.revokeObjectURL(url);
                                    }
                                }}
                            >导出配置</button>
                            <label className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold shadow hover:bg-green-700 transition cursor-pointer text-center border-none" style={{ display: 'block' }}>
                                导入配置
                                <input
                                    type="file"
                                    accept="application/json"
                                    style={{ display: 'none' }}
                                    onChange={e => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        const reader = new FileReader();
                                        reader.onload = evt => {
                                            try {
                                                const imported = JSON.parse(evt.target?.result as string);
                                                if (Array.isArray(imported)) {
                                                    localStorage.setItem('mc_admin_configs', JSON.stringify(imported));
                                                    setConfigs(imported);
                                                }
                                            } catch { }
                                        };
                                        reader.readAsText(file);
                                    }}
                                />
                            </label>
                        </div>
                        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
                    </>
                ) : (
                    <div className="flex flex-col gap-4 overflow-y-auto">
                        <div ref={historyContainerRef} className="bg-gray-900 text-white rounded-lg p-4 font-mono text-sm overflow-auto flex flex-col border-box">
                            {history.length === 0 && <div className="text-gray-500">欢迎使用，输入指令后回车发送。</div>}
                            {history.map((item, idx) => (
                                <div key={idx}>
                                    <div className="flex"><span className="text-green-400">$</span>&nbsp;<span className="text-blue-300">{item.cmd}</span></div>
                                    <div className="pl-4" dangerouslySetInnerHTML={{ __html: mcToHtml(item.resp) }}></div>
                                </div>
                            ))}
                        </div>
                        <form
                            onSubmit={e => { e.preventDefault(); if (command.trim()) { sendCommand(command); setCommand(''); setHistoryIndex(null); if (inputRef) inputRef.focus(); } }}
                            className="flex gap-2"
                        >
                            <span className="text-green-400 font-mono pt-2">$</span>
                            <input
                                ref={ref => setInputRef(ref)}
                                value={command}
                                onChange={e => { setCommand(e.target.value); setHistoryIndex(null); }}
                                onKeyDown={e => {
                                    if (e.key === 'ArrowUp') {
                                        e.preventDefault();
                                        if (history.length === 0) return;
                                        let idx = historyIndex === null ? history.length - 1 : historyIndex - 1;
                                        if (idx < 0) idx = 0;
                                        setCommand(history[idx]?.cmd || '');
                                        setHistoryIndex(idx);
                                    } else if (e.key === 'ArrowDown') {
                                        e.preventDefault();
                                        if (history.length === 0) return;
                                        let idx = historyIndex === null ? history.length : historyIndex + 1;
                                        if (idx >= history.length) {
                                            setCommand('');
                                            setHistoryIndex(null);
                                        } else {
                                            setCommand(history[idx]?.cmd || '');
                                            setHistoryIndex(idx);
                                        }
                                    }
                                }}
                                className="min-w-0 flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-700 font-mono"
                                placeholder="输入指令并回车..."
                                autoFocus
                                autoComplete="off"
                            />
                            <button
                                type="submit"
                                className="shrink-0 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 shadow cursor-pointer"
                            >发送</button>
                        </form>
                        <button
                            onClick={() => { setAuthed(false); setCommand(''); setHistory([]); }}
                            className="text-xs text-gray-400 hover:text-gray-700 mt-2 self-end cursor-pointer"
                        >退出登录</button>
                        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
                    </div>
                )}
            </div>
        </div>
    );
}
export default Home;

const colorMap = {
    '0': '#000000', // 黑色
    '1': '#0000AA', // 深蓝色
    '2': '#00AA00', // 深绿色
    '3': '#00AAAA', // 青色
    '4': '#AA0000', // 深红色
    '5': '#AA00AA', // 紫色
    '6': '#FFAA00', // 金色
    '7': '#AAAAAA', // 浅灰色
    '8': '#555555', // 深灰色
    '9': '#5555FF', // 蓝色
    'a': '#55FF55', // 绿色
    'b': '#55FFFF', // 浅青色
    'c': '#FF5555', // 红色
    'd': '#FF55FF', // 粉红色
    'e': '#FFFF55', // 黄色
    'f': '#FFFFFF', // 白色
    'l': 'font-weight: bold',
    'o': 'font-style: italic',
    'n': 'text-decoration: underline',
    'm': 'text-decoration: line-through',
    'k': 'color: transparent; text-shadow: 0 0 3px currentColor',
    'r': 'all: unset'
};

function mcToHtml(text: string): string {
    if (!text) return '';

    const textWithBr = text.replaceAll('\n', '<br />');

    const htmlWithSpans = textWithBr.replace(
        /§([0-9a-fklmnor])/gi,
        (match, code: string) => {
            const style = colorMap[code.toLowerCase() as keyof typeof colorMap];
            if (!style) return '';

            const spanStyle = style.startsWith('#')
                ? `color: ${style}`
                : style;
            return `</span><span style="${spanStyle}">`;
        }
    );
    console.log(htmlWithSpans);

    return `<span>${htmlWithSpans}</span>`;
}