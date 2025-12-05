import { BsFillTelephoneFill } from "react-icons/bs";
import { MdEmail } from "react-icons/md";
import { FaBook } from "react-icons/fa";

import styles from "./Footer.module.css";

export function Footer() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <FaBook size={24} />
        <div>
          <p className={styles.location}>
            <b>© 2025 BookHub. Biblioteca Central (BCE).</b> 12.345.678/0001-95<br />
            Av. Colombo, 5790 - Zona 7, Maringá - PR, 87020-900
          </p>
          <div className={styles.contact}>
            <div>
              <MdEmail size={16} />
              <a href="mailto:contato.bce@uem.br">contato.bce@uem.br</a>
            </div>
            <div>
              <BsFillTelephoneFill size={16} />
              <a href="tel:+5544912345678">(44) 91234-5678</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
