import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";
import navStyles from "../styles/navBar.module.css";

// These components are not created yet as pages, so clicking the navs will do nothing for now.
import CompanyRegistration from "./CompanyRegistration";
import QuoteManagement from "./QuoteManagement";

export default function Layout({ children }) {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState("대시보드"); // Default to dashboard
  const [showSalesSubMenu, setShowSalesSubMenu] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
    };
    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        router.push("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleNavClick = (tab) => {
    setActiveTab(tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case '업체 등록':
        return <CompanyRegistration />;
      case '견적':
        return <QuoteManagement />;
      case '대시보드':
      default:
        return children;
    }
  };

  const navItems = [
    { label: "대시보드", tab: "대시보드" },
    { label: "구매", tab: "구매" },
    { label: "송금", tab: "송금" },
    {
      label: "판매",
      isToggle: true,
      onClick: () => setShowSalesSubMenu(!showSalesSubMenu),
      subItems: [
        { label: "견적", tab: "견적" },
        { label: "주문", tab: "주문" },
        { label: "생산", tab: "생산" },
        { label: "출고", tab: "출고" },
        { label: "배송", tab: "배송" },
      ],
    },
    { label: "입금", tab: "입금" },
    { label: "업체 등록", tab: "업체 등록" },
    { label: "제품 등록", tab: "제품 등록" },
  ];

  if (!session) {
    return null; // Or a loading spinner
  }

  return (
    <div className={navStyles.layoutContainer}>
      <nav className={navStyles.navBar}>
        <div className={navStyles.navLinks}>
          {navItems.map((item) => (
            <div key={item.label}>
              <div
                className={`${navStyles.navLink} ${
                  activeTab === item.tab ? navStyles.navLinkActive : ""
                }`}
                onClick={
                  item.isToggle
                    ? item.onClick
                    : () => handleNavClick(item.tab)
                }
              >
                {item.label}
              </div>
              {item.isToggle && showSalesSubMenu && item.subItems && (
                <div className={navStyles.navSubMenu}>
                  {item.subItems.map((subItem) => (
                    <div
                      key={subItem.label}
                      className={`${navStyles.navLink} ${
                        navStyles.navSubLink
                      } ${
                        activeTab === subItem.tab ? navStyles.navLinkActive : ""
                      }`}
                      onClick={() => handleNavClick(subItem.tab)}
                    >
                      {subItem.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className={navStyles.navSpacer}></div>
        <div className={navStyles.userInfo}>
          <p>{session.user.user_metadata.display_name || session.user.email}</p>
          <button className={navStyles.logoutButton} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>
      <main className={navStyles.mainContent}>{renderContent()}</main>
    </div>
  );
}
