import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Settings, User, Palette, Shield, HelpCircle } from 'lucide-react';

interface MenuDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const MenuDropdown: React.FC<MenuDropdownProps> = ({ isOpen, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuRef.current) return;
    
    if (isOpen) {
      // Animate menu in
      const menuAnimation = gsap.fromTo(menuRef.current,
        { y: -20, opacity: 0, scale: 0.95 },
        { 
          y: 0, 
          opacity: 1, 
          scale: 1, 
          duration: 0.3, 
          ease: 'back.out(1.7)' 
        }
      );
      
      // Animate menu items with a small delay to ensure they're rendered
      const items = document.querySelectorAll('.menu-item');
      if (items.length > 0) {
        gsap.fromTo(items,
          { opacity: 0, x: -10 },
          { 
            opacity: 1, 
            x: 0, 
            duration: 0.3, 
            stagger: 0.05, 
            ease: 'power2.out' 
          }
        );
      }
      
      return () => {
        menuAnimation.kill();
      };
    } else if (menuRef.current) {
      // Animate menu out
      gsap.to(menuRef.current, {
        y: -20, 
        opacity: 0, 
        scale: 0.95, 
        duration: 0.2, 
        ease: 'power2.in'
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const menuItems = [
    { icon: User, label: 'Profile', action: () => {} },
    { icon: Settings, label: 'Settings', action: () => {} },
    { icon: Palette, label: 'Theme', action: () => {} },
    { icon: Shield, label: 'Privacy', action: () => {} },
    { icon: HelpCircle, label: 'Help', action: () => {} },
  ];

  return (
    <>
      <div className="menu-overlay" onClick={onClose} />
      <div ref={menuRef} className="menu-dropdown glass-effect">
        {menuItems.map((item, index) => (
          <button
            key={index}
            className="menu-item"
            onClick={() => {
              item.action();
              onClose();
            }}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </>
  );
};

export default MenuDropdown;