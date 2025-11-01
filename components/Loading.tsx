import Image from "next/image";
import styles from "./Loading.module.css";

interface LoadingProps {
  message?: string;
}

export default function Loading({ message = "Loading..." }: LoadingProps) {
  return (
    <div className={styles.container}>
      <div className={styles.logoWrapper}>
        <Image
          src="/logo.png"
          alt="Loading"
          width={80}
          height={80}
          className={styles.logo}
        />
        <div className={styles.pulse}></div>
      </div>
      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
}
