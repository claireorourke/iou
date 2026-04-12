import React from "react";

export function ScrollToTop(): React.JSX.Element | null {
    const [visible, setVisible] = React.useState(false);

    React.useEffect(() => {
        function onScroll() {
            setVisible(window.scrollY > 300);
        }
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    if (!visible) return null;

    return (
        <button
            className="scroll-to-top"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="scroll to top"
        >
            ↑
        </button>
    );
}
