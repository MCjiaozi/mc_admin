'use client'
import axios from 'axios';
import { useRef, useState } from 'react';
import { useEffect } from 'react';
const Home = () => {
    const [password, setPassword] = useState('');
    const [authed, setAuthed] = useState(false);
    const [error, setError] = useState('');
    const [command, setCommand] = useState('');
    const [history, setHistory] = useState<Array<{ cmd: string; resp: string }>>([]);
    const [inputRef, setInputRef] = useState<any>(null);
    const [historyIndex, setHistoryIndex] = useState<number | null>(null);
    const historyContainerRef = useRef<HTMLDivElement>(null);
    const sendCommand = async (command: string) => {
        try {
            const res = await axios.post('/api/send-command', { command, password });
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
    const handleAuth = () => {
        if (!password) {
            setError('请输入密码');
            return;
        }
        axios.post('/api/auth/login', { password }).then(res => {
            if (res.data.error) {
                setError(res.data.error);
                setAuthed(false);
            } else {
                setAuthed(true);
                setError('');
                document.cookie = `mc_admin_pwd=${encodeURIComponent(password)}; path=/; max-age=2592000`;
            }
        }).catch((error: any) => {
            const errMsg = error.response && error.response.data && error.response.data.error ? error.response.data.error : (error instanceof Error ? error.message : '网络错误或服务器异常');
            setError(errMsg);
        });
    };

    useEffect(() => {
        const match = document.cookie.match(/(?:^|; )mc_admin_pwd=([^;]*)/);
        if (match && match[1]) {
            setPassword(decodeURIComponent(match[1]));
            axios.post('/api/auth/login', { password: decodeURIComponent(match[1]) }).then(res => {
                if (!res.data.error) {
                    setAuthed(true);
                    setError('');
                } else {
                    setAuthed(false);
                    setError(res.data.error);
                }
            }).catch((error: any) => {
                const errMsg = error.response && error.response.data && error.response.data.error ? error.response.data.error : (error instanceof Error ? error.message : '网络错误或服务器异常');
                setError(errMsg);
                document.cookie = 'mc_admin_pwd=; path=/; max-age=0';
            });
        }
    }, []);
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-200">
            <div className="max-w-[calc(100vw-20px)] sm:max-w-[80vw] max-h-[calc(100vh-20px)] sm:max-h-[80vh] bg-white rounded-2xl shadow-2xl p-12 flex flex-col gap-4">
                <h1 className="text-3xl font-bold text-center text-purple-700 mb-4">Minecraft 管理终端</h1>
                {!authed ? (
                    <>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { handleAuth(); } }}
                            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-700"
                            placeholder="请输入管理密码..."
                        />
                        <button
                            onClick={handleAuth}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 shadow"
                        >
                            登录
                        </button>
                        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
                    </>
                ) : (
                    <div className="flex flex-col gap-4 overflow-auto">
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
                            onClick={() => { setAuthed(false); setPassword(''); setCommand(''); setHistory([]); document.cookie = 'mc_admin_pwd=; path=/; max-age=0'; }}
                            className="text-xs text-gray-400 hover:text-gray-700 mt-2 self-end cursor-pointer"
                        >退出登录</button>
                        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
                    </div>
                )}
            </div>
        </div>
    )

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