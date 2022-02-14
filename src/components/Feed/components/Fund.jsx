import { useMoralisDapp } from "providers/MoralisDappProvider/MoralisDappProvider";
import { useMoralisQuery, useWeb3ExecuteFunction } from "react-moralis";
import { useEffect, useState, createElement } from "react";
import { Comment, Tooltip, Avatar, message, Divider } from "antd";
import Text from "antd/lib/typography/Text";
import Blockie from "components/Blockie";
import glStyles from "components/gstyles";
import Donations from "./Donations"
import Receivers from "./Receivers";

const Fund = ({fund}) => {
    const { contentId, fundId, fundOwner, receivers } = fund;
    const [fundContent, setPosContent] = useState({ title: "default", content: "default" });
    const { data } = useMoralisQuery("Contents", (query) => query.equalTo("contentId", contentId));
    const [donationStatus, setDonationStatus] = useState();
    const { data: donations } = useMoralisQuery("Donations", (query) => query.equalTo("fundId", fundId), [], {
        live: true,
    });
    
    const { walletAddress, contractABI, contractAddress} = useMoralisDapp();
    const contractABIJson = JSON.parse(contractABI);
    const contractProcessor = useWeb3ExecuteFunction();
    const [donationAmount, setDonation] = useState("");


    useEffect(() => {
        function extractUri(data) {
          const fetchedContent = JSON.parse(JSON.stringify(data, ["contentUri"]));
          const contentUri = fetchedContent[0]["contentUri"];
          return contentUri;
        }
        async function fetchIPFSDoc(ipfsHash) {
          console.log(ipfsHash);
          const url = ipfsHash;
          const response = await fetch(url);
          return await response.json();
        }
        async function processContent() {
          const content = await fetchIPFSDoc(extractUri(data));
          setPosContent(content);
        }
        if (data.length > 0) {
          processContent();
        }
      }, [data]);
    
    useEffect(() => {
        if (!donations?.length) return null;

        async function getFundAmountStatus() {
            const fetchedDonations = JSON.parse(JSON.stringify(donations));
            fetchedDonations.forEach(({ donater, up }) => {
            if (donater === walletAddress) setDonationStatus(up ? "donated" : "retracted");
            });
            return;
        }

        getFundAmountStatus();
    }, [donations, walletAddress]);
    

    async function Donate(amount){
        if (walletAddress.toLowerCase() === fundOwner.toLowerCase()) return message.error("You cannot donate to your own fund");
        const options = {
            contractAddress: contractAddress,
            functionName: "donate",
            abi: contractABIJson,
            value: amount * 1e18,
            params: {
              _fundId: fund["fundId"],
              _reputationAdded: 1,
            },
          };
          await contractProcessor.fetch({
            params: options,
            onSuccess: () => console.log("success"),
            onError: (error) => console.error(error),
          });
    }

    async function endFundraiser(){
        if (walletAddress.toLowerCase() !== fundOwner.toLowerCase()) return message.error("Only the fund owner can end the fundraiser.");
        const options = {
            contractAddress: contractAddress,
            functionName: "endFund",
            abi: contractABIJson,
            params: {
              _fundId: fund["fundId"],
            },
          };
          await contractProcessor.fetch({
            params: options,
            onSuccess: () => console.log("success"),
            onError: (error) => console.error(error),
          });
    }

    async function withrawFunding(){
        if (walletAddress.toLowerCase() !== fundOwner.toLowerCase()) return message.error("Only the fund owner can end the fundraiser.");
        const options = {
            contractAddress: contractAddress,
            functionName: "withdrawFunding",
            abi: contractABIJson,
            params: {
              _fundId: fund["fundId"],
              _receiver: walletAddress
            },
          };
          await contractProcessor.fetch({
            params: options,
            onSuccess: () => console.log("success"),
            onError: (error) => console.error(error),
          });
    }

    async function RetractDonation(){
        if (walletAddress.toLowerCase() === fundOwner.toLowerCase()) return message.error("You cannot retract from your own fund");
        const options = {
            contractAddress: contractAddress,
            functionName: "retractDonation",
            abi: contractABIJson,
            params: {
              _receiver: walletAddress,
              _fundId: fund["fundId"],
              _reputationTaken: 1,
            },
          };
          await contractProcessor.fetch({
            params: options,
            onSuccess: () => console.log("success"),
            onError: (error) => console.error(error),
          });
    }
    const validateForm = () => {
        let result = !donationAmount ? false: true;
        return result
    }

   const clearForm = () =>{
        setDonation('');
    }
    
    function onSubmit(e){
        e.preventDefault();
        if(!validateForm()){
            return message.error("Remember to add the title and the content of your post")
        }
        Donate(donationAmount);
        clearForm();
    }
    
    const fundOwnerCapabilites = () => {
        if(walletAddress === fundOwner){
            return (
                <span style={{marginTop:"0px", marginLeft:"-12px", float:"left" }}>
                    <button className="btn btn-dark " style={{float:"right", }} onClick={() => endFundraiser()}>End Fundraiser</button>
                </span>
            )
        }
        else return null;
    }

    const receiverCapabilites = () => {
        if(receivers.find(r => r.toLowerCase() === walletAddress.toLowerCase())){
            return (
                <button className="btn btn-dark " style={{float:"right"}} onClick={() => withrawFunding()}>Withdraw Donated Funds</button>
            )
        }
        else return null;
    }

    const actions = [
    <Tooltip key="comment-basic-like" title="Donate to the fundraiser">
            Fundraiser Receivers:
                <span style={{ fontSize: "15px" }}> <Receivers fundId={fundId}/></span>
            <br></br>
            Total Donations (ETH):
                <span style={{ fontSize: "15px" }}> <Donations fundId={fundId}/></span>
        <span style={{ fontSize: "15px", display: "flex", alignItems: "center" }}>

        {/* Input field */}  
        <form onSubmit={onSubmit}>
            <div className ="row">
                <div className="form-group">
                    <input
                    type="number"
                    step="0.01"
                    className="mb-2 mt-2 form-control"
                    placeholder="Donation Amount (ETH)"
                    value={donationAmount}
                    onChange={(e) => setDonation(e.target.value)}
                    />
                </div>
                <button type="submit" className="btn btn-dark ">Donate</button>
            </div>
        </form>
        </span>
    </Tooltip>,
    <Tooltip key="comment-basic-dislike" title="Retract all donations given">
        <span style={{ fontSize: "15px", marginRight: "250px", marginTop:"-170px", width: "100%", float:"left" }}>
            {/* This should display the total fundraising given by this user*/}  
            <button className="btn btn-dark " style={{float:"right"}} onClick={() => RetractDonation()}>Retract Donations</button>
        </span>
    </Tooltip>,
    fundOwnerCapabilites(),
    receiverCapabilites()
    ];  

    const loading = "";

    const result = (
        <Comment
        style={{ ...glStyles.card, padding: "0px 15px", marginBottom: "10px" }}
        actions={actions}
        author={<Text strong>{fund["fundOwner"]}</Text>}
        avatar={<Avatar src={<Blockie address={fund["fundOwner"]} scale={4} />}></Avatar>}
        content={
            <>
            <Text strong style={{ fontSize: "20px", color: "#333" }}>
                {fundContent["title"]}
            </Text>
            <p style={{ fontSize: "15px", color: "#111" }}>{fundContent["content"]}</p>
            <Divider style={{ margin: "15px 0" }} />
            </>
        }
      />
    )
    
    
    return fundContent["title"] === "default" ? loading : result;
}

export default Fund
