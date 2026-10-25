using System;
using System.Collections.Generic;
using System.Globalization;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

// KeygardenKeys.exe
//
// A deliberately tiny, dependency-free global key observer. It reports only a
// coarse category for each physical key press (letter / digit / punct / space /
// enter / backspace) and a timestamp. Key codes and characters never leave this
// process. The Electron main process spawns it while observation is enabled and
// kills it when the user pauses.
internal static class KeygardenKeys
{
    private const int VK_CONTROL = 0x11;
    private const int VK_LWIN = 0x5B;
    private const int VK_RWIN = 0x5C;

    private static readonly int[] Keys = BuildKeys();
    private static readonly Dictionary<int, string> Categories = BuildCategories();
    private static volatile bool _quit;

    [DllImport("user32.dll")]
    private static extern short GetAsyncKeyState(int vKey);

    [STAThread]
    private static int Main()
    {
        Console.OutputEncoding = new UTF8Encoding(false);
        Emit("ready", null);

        // Don't count keys that happened to be held while we started.
        var down = new Dictionary<int, bool>();
        foreach (var key in Keys)
        {
            down[key] = IsDown(key);
        }

        // The parent talks to us over stdin. EOF or "quit" means stop.
        var input = new Thread(() =>
        {
            try
            {
                string line;
                while ((line = Console.In.ReadLine()) != null)
                {
                    if (line.Trim().Equals("quit", StringComparison.OrdinalIgnoreCase))
                    {
                        _quit = true;
                        break;
                    }
                }
                _quit = true;
            }
            catch
            {
                _quit = true;
            }
        });
        input.IsBackground = true;
        input.Start();

        var heartbeat = DateTime.UtcNow;
        while (!_quit)
        {
            var now = DateTime.UtcNow;
            var shortcutDown = IsDown(VK_CONTROL) || IsDown(VK_LWIN) || IsDown(VK_RWIN);

            foreach (var key in Keys)
            {
                var isDown = IsDown(key);
                if (isDown && !down[key] && !shortcutDown)
                {
                    Emit("key", Categories[key]);
                }
                down[key] = isDown;
            }

            if ((now - heartbeat).TotalSeconds >= 5)
            {
                Emit("heartbeat", null);
                heartbeat = now;
            }

            Thread.Sleep(8);
        }

        return 0;
    }

    private static bool IsDown(int key)
    {
        return (GetAsyncKeyState(key) & 0x8000) != 0;
    }

    private static int[] BuildKeys()
    {
        var keys = new List<int>();

        // A-Z
        for (var key = 0x41; key <= 0x5A; key++) keys.Add(key);

        // Top row and numpad digits
        for (var key = 0x30; key <= 0x39; key++) keys.Add(key);
        for (var key = 0x60; key <= 0x69; key++) keys.Add(key);

        // Whitespace and editing
        keys.Add(0x20); // space
        keys.Add(0x0D); // enter
        keys.Add(0x08); // backspace

        // Common punctuation on a US layout, plus numpad operators.
        foreach (var key in new[] { 0xBA, 0xBB, 0xBC, 0xBD, 0xBE, 0xBF, 0xC0, 0xDB, 0xDC, 0xDD, 0xDE, 0x6A, 0x6B, 0x6D, 0x6E, 0x6F })
        {
            keys.Add(key);
        }

        return keys.ToArray();
    }

    private static Dictionary<int, string> BuildCategories()
    {
        var map = new Dictionary<int, string>();
        for (var key = 0x41; key <= 0x5A; key++) map[key] = "letter";
        for (var key = 0x30; key <= 0x39; key++) map[key] = "digit";
        for (var key = 0x60; key <= 0x69; key++) map[key] = "digit";
        map[0x20] = "space";
        map[0x0D] = "enter";
        map[0x08] = "backspace";
        foreach (var key in new[] { 0xBA, 0xBB, 0xBC, 0xBD, 0xBE, 0xBF, 0xC0, 0xDB, 0xDC, 0xDD, 0xDE, 0x6A, 0x6B, 0x6D, 0x6E, 0x6F })
        {
            map[key] = "punct";
        }
        return map;
    }

    private static void Emit(string type, string category)
    {
        var timestamp = (long)(DateTime.UtcNow - new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc)).TotalMilliseconds;
        var categoryJson = category == null ? "null" : "\"" + category + "\"";
        Console.Out.WriteLine("{\"v\":1,\"type\":\"" + type + "\",\"category\":" + categoryJson + ",\"t\":" + timestamp.ToString(CultureInfo.InvariantCulture) + "}");
        Console.Out.Flush();
    }
}
