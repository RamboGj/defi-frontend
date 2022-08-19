import { ethers } from "ethers";
import { CircleNotch } from "phosphor-react";
import { useEffect, useState } from "react";
import styles from "./App.module.css";
import ContractAbi from "./ContractAbi.json";

interface MemosProps {
  address: string;
  buyerName: string;
  buyerMessage: string;
  timestamp: number;
}

export default function App() {
  const [currentAccount, setCurrentAccount] = useState<string>("");
  const [buyerName, setBuyerName] = useState<string>("");
  const [buyerMessage, setBuyerMessage] = useState<string>("");
  const [memos, setMemos] = useState<MemosProps[]>([]);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isBuying, setIsBuying] = useState<boolean>(false)
  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false)
  const [contractFunds, setContractFunds] = useState<number | null>(null)

  const isAbleToBuy = buyerName !== '' && buyerMessage !== ''
  const isAbleToWithdrawFunds = contractFunds ? contractFunds > 0 : false
  
  const contractAddress = "0xe58E36837391be1235AeDc2825F9613809b949cf";
  const contractAbi = ContractAbi.abi;

  async function connectWallet() {
    try {
      const { ethereum } = window;

      if (ethereum && ethereum.request) {
        setIsLoading(true)
        await ethereum.request({ method: "eth_requestAccounts" });
        await isWalletConnected()
        setIsLoading(false)
      }
    } catch (error) {
      console.log(error, "Install Metamask!");
    }
  }

  async function isWalletConnected() {
    try {
      const { ethereum } = window;

      if (ethereum && ethereum.request) {
        const accounts = await ethereum.request({ method: "eth_accounts" });
        console.log("Accounts: ", accounts);

        if (accounts.length > 0) {
          setCurrentAccount(accounts[0]);
          console.log("Wallet Connected: ", accounts[0]);
        } else {
          setCurrentAccount("");
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function buyCoffe() {
    try {
      const { ethereum } = window;

      if (ethereum) {
        setIsBuying(true)
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          contractAddress,
          contractAbi,
          signer
        );

        console.log("Buying coffe...");
        const coffeTxn = await contract.buyCoffe(buyerName, buyerMessage, {
          value: ethers.utils.parseEther("0.001"),
        });

        await coffeTxn.wait();

        console.log("Coffe bought, mined!", coffeTxn.hash);

        setMemos((previous) => [...previous, coffeTxn])

        setBuyerName("");
        setBuyerMessage("");
        setIsBuying(false)
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function isAbleToWithdraw() {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();

        const contract = new ethers.Contract(
          contractAddress,
          contractAbi,
          signer
        );

        const owner = await contract.getOwnerAddress();

        if (currentAccount && owner.toLowerCase() == currentAccount.toLowerCase()) {
          setIsOwner(true);
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function getContractFunds() {
    try {
      const { ethereum } = window

      if (ethereum) {

        const provider = new ethers.providers.Web3Provider(ethereum)
        const signer = await provider.getSigner()

        const contract = new ethers.Contract(
          contractAddress,
          contractAbi,
          signer
        )

        const funds = await contract.getContractFunds()
        const formattedFunds = ethers.utils.formatEther(funds.toNumber())
        console.log("response: ", ethers.utils.formatEther(funds.toNumber()))
        setContractFunds(Number(formattedFunds))
      }

    } catch (error) {
      console.log(error)
    }
  } 

  async function withdrawFunds() {
    try {
      const { ethereum } = window

      if (ethereum) {
        setIsWithdrawing(true)

        const provider = new ethers.providers.Web3Provider(ethereum)
        const signer = await provider.getSigner()

        const contract = new ethers.Contract(
          contractAddress,
          contractAbi,
          signer
        )

        await contract.withdrawTips()
        setIsWithdrawing(false)
      }

    } catch (error) {
      console.log(error)
    }
  }

  let memosList

  async function getMemos() {
    try {
      const { ethereum } = window

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum)
        const signer = await provider.getSigner()

        const contract = new ethers.Contract(
          contractAddress,
          contractAbi,
          signer
        )

        memosList = await contract.getMemos()
        console.log("memoList: ", memosList)
        setMemos(memosList)
      }

    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
      isWalletConnected();
      isAbleToWithdraw();
  }, [currentAccount, isOwner]);

  useEffect(() => {
    getMemos()
    getContractFunds()
  }, [memosList, contractFunds])

  return (
    <div className={styles.screenWrapper}>
      <div className={styles.balanceCard}>
          <h1>Contract <strong>Funds</strong></h1>
          <span>{`${contractFunds} ETH`}</span>
      </div>
      <div className={styles.card}>
        <div className={styles.wrapper}>
          <h1>
            Buy me a <strong>COFFE</strong>!
          </h1>

          <div>
            {!currentAccount && (
              <div className={styles.contentWrapper}>
                <button className={styles.buyCoffeButton} onClick={connectWallet}>
                  {isLoading ? <CircleNotch className={styles.loading} size={28} /> : 'Connect your wallet'}
                </button>
              </div>
            )}
                <div className={styles.contentWrapper}>
                  <label htmlFor="name">Name</label>
                  <input
                    onChange={(e) => setBuyerName(e.target.value)}
                    type="text"
                    id="name"
                  />

                  <label htmlFor="message">Send a message</label>
                  <textarea
                    onChange={(e) => setBuyerMessage(e.target.value)}
                    id="message"
                  />

                  <button className={styles.buyCoffeButton} onClick={buyCoffe} disabled={!isAbleToBuy}>
                    {isBuying ? <CircleNotch className={styles.loading} size={28} /> : 'Send 1 Coffe for 0.001ETH'}
                  </button>
                </div>
              

              {isOwner && currentAccount != '' && (
                <div className={styles.contentWrapper}>
                  <button className={styles.buyCoffeButton} onClick={withdrawFunds} disabled={!isAbleToWithdrawFunds}>
                    {isWithdrawing ? <CircleNotch className={styles.loading} size={28} /> : 'Withdraw Contract Funds'}
                  </button>
                </div>
              )}
                  
              {memos.map((memos) => {
                <div className={styles.memosContainer}>
                  <p>{memos.buyerMessage}</p>
                </div>
              })}

          </div>
        </div>
      </div>
    </div>
  );
}
