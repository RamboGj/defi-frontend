import { ethers } from "ethers";
import { CircleNotch } from "phosphor-react";
import { memo, useEffect, useState } from "react";
import styles from "./App.module.css";
import ContractAbi from "./ContractAbi.json";

interface MemosProps {
  sender: string;
  name: string;
  message: string;
  timestamp: Date;
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
  const [contractFunds, setContractFunds] = useState<number>(0)

  let memosList: MemosProps[] = []

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

        await coffeTxn.wait()
        setBuyerName("")
        setBuyerMessage("")
        setIsBuying(false)

        console.log("Coffe bought, mined!", coffeTxn.hash);

        setMemos((previous) => [...previous, coffeTxn])

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
    getContractFunds()
  }, [isBuying])

  useEffect(() => {
    console.log("memos var:", memos)
  }, [])

  useEffect(() => {
    getMemos()
    let buyMeACoffee: any

    // Create an event handler function for when someone sends
    // us a new memo.
    const onNewMemo = (from: string, timestamp: Date, name: string, message: string) => {
      setMemos((prevState) => [
        ...prevState,
        {
          sender: from,
          timestamp: timestamp,
          message: message,
          name: name
        }
      ]);
    };

    const {ethereum} = window;

    // Listen for new memo events.
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum, "any");
      const signer = provider.getSigner();
      buyMeACoffee = new ethers.Contract(
        contractAddress,
        contractAbi,
        signer
      );

      buyMeACoffee.on("NewMemo", onNewMemo);
    }

    return () => {
      if (buyMeACoffee) {
        buyMeACoffee.off("NewMemo", onNewMemo);
      }
    }
  }, [])

  return (
    <div className={styles.screenWrapper}>
      <div className={styles.twoSmallerCardsWrapper}>
        <div className={styles.balanceCard}>
            <h1>Contract <strong>Funds</strong></h1>
            <span>{`${contractFunds} ETH`}</span>
        </div>
        <div className={styles.memosCard}>
          <h1><strong>Last 3</strong> Coffes</h1>

          <div className={styles.memosListContent}>
            {memos.slice(memos.length - 4, memos.length - 1).map((memo) => {
              return (
                <>
                <div className={styles.memoData}>
                  <h1>{memo.name}</h1>
                  <p><strong>Message:</strong> {memo.message}</p>
                  <p><strong>Sender:</strong> {memo.sender}</p>
                </div>
                </>
              )
            })}
          </div>
        </div>
      </div>
      <div className={styles.card}>
        <div className={styles.wrapper}>
          <h1>
            Buy me a <strong>COFFE</strong>!
          </h1>

          <div>
            <>
              {!currentAccount &&
                <div className={styles.contentWrapper}>
                  <button className={styles.buyCoffeButton} onClick={connectWallet}>
                    {isLoading ? <CircleNotch className={styles.loading} size={28} /> : 'Connect your wallet'}
                  </button>
                </div>
              }
              {currentAccount && 
                <div className={styles.contentWrapper}>
                  <label htmlFor="name">Name</label>
                  <input
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    type="text"
                    id="name"
                  />

                  <label htmlFor="message">Send a message</label>
                  <textarea
                    value={buyerMessage}
                    onChange={(e) => setBuyerMessage(e.target.value)}
                    id="message"
                  />

                  <button className={styles.buyCoffeButton} onClick={buyCoffe} disabled={!isAbleToBuy || isBuying}>
                    {isBuying ? <CircleNotch className={styles.loading} size={28} /> : 'Send 1 Coffe for 0.001ETH'}
                  </button>
                </div>
              }    

              {isOwner && currentAccount != '' && (
                <div className={styles.contentWrapper}>
                  <button className={styles.buyCoffeButton} onClick={withdrawFunds} disabled={!isAbleToWithdrawFunds || isWithdrawing}>
                    {isWithdrawing ? <CircleNotch className={styles.loading} size={28} /> : 'Withdraw Contract Funds'}
                  </button>
                </div>
              )}
                    
              
            </> 
          </div>
        </div>
      </div>
    </div>
  );
}
