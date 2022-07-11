const REPLACE = "";

const Web3 = require("web3");
const provider = new Web3.providers.HttpProvider(
  `https://mainnet.infura.io/v3/${REPLACE}`
);
const web3 = new Web3(provider);
const azukiABI = require("./azuki.json");
// const seaportABI = require("./seaport.json");
const orderFulfilledEvent = require("./order.json");

const seaportAddress =
  "0x00000000006c3852cbEf3e08E8dF289169EdE581".toLowerCase();

const azukiAddress = "0xed5af388653567af2f388e6224dc7c4b3241c544".toLowerCase();
const azukiContract = new web3.eth.Contract(azukiABI, azukiAddress);

async function main() {
  const currentBlock = await web3.eth.getBlockNumber();
  console.log("Current:", currentBlock);

  const pastBlock = currentBlock - 6500;
  console.log("Past:", pastBlock);

  try {
    azukiContract.getPastEvents(
      "Transfer",
      { fromBlock: pastBlock, toBlock: currentBlock },
      async (err, res) => {
        const onlySalesArr = [];
        if (!err) {
          try {
            const sale = await getSales(res);
            console.log("SALE:", sale);
            //onlySalesArr.push(sale);
          } catch (error) {
            console.log(error);
          }
          console.log("onlySalesArr:", onlySalesArr);
        } else {
          console.log(err);
        }
      }
    );
  } catch (e) {
    console.log(e);
  }
}

function getOSSales(saleLog, txHash) {
  let total = 0;
  let tokenId;
  if (saleLog.consideration[0].itemType === "2") {
    total = Number(web3.utils.fromWei(saleLog.offer[0].amount, "ether"));
    tokenId = saleLog.consideration[0].identifier.toString();
  } else {
    saleLog.consideration.forEach((con, index) => {
      let temp = Number(web3.utils.fromWei(con.amount, "ether"));
      total += temp;
      tokenId = saleLog.offer[0].identifier;
    });
  }

  let obj = {
    tokenID: tokenId,
    price: total.toFixed(2),
    txHash: txHash,
  };

  return obj;
}

async function getSales(res) {
  //get all receipts and put it into receipts array
  const receipts = [];
  try {
    for (let event of res) {
      const txReceipt = await web3.eth.getTransactionReceipt(
        event.transactionHash
      );

      let firstLog = txReceipt.logs[0];
      if (firstLog.address.toLowerCase() === seaportAddress) {
        let saleLog = web3.eth.abi.decodeLog(
          orderFulfilledEvent,
          firstLog.data,
          firstLog.topics.slice(1)
        );

        let sale = getOSSales(saleLog, txReceipt.transactionHash);

        // console.log("Sale:", sale);
        receipts.push(sale);
      }
    }
  } catch (e) {
    console.log("ERROR:", e);
  }
  //   console.log("receipts:", receipts);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
