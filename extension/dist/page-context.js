(() => {
  const currentScript = document.currentScript;
  const eventName = currentScript?.dataset?.reddprowlEvent;
  if (!eventName) return;

  const dispatch = (username) => {
    window.dispatchEvent(new CustomEvent(eventName, { detail: { username } }));
  };

  const normalize = (value) => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim().replace(/^u\//i, "").replace(/^@/, "");
    return /^[A-Za-z0-9_-]{3,32}$/.test(trimmed) ? trimmed : null;
  };

  const resolveFromGlobals = () => {
    const candidates = [
      window.___r?.accountManager?.currentAccount?.displayText,
      window.___r?.accountManager?.currentAccount?.name,
      window.___r?.user?.account?.displayText,
      window.___r?.user?.account?.name,
      window.__INITIAL_STATE__?.session?.user?.account?.name,
      window.__INITIAL_STATE__?.user?.account?.name,
      window.__INITIAL_STATE__?.accounts && Object.keys(window.__INITIAL_STATE__.accounts)[0],
    ];

    for (const candidate of candidates) {
      const username = normalize(candidate);
      if (username) return username;
    }
    return null;
  };

  const resolve = async () => {
    dispatch(resolveFromGlobals());
  };

  void resolve();
})();
