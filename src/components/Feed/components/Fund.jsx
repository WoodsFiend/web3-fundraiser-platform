import { useMoralisDapp } from "providers/MoralisDappProvider/MoralisDappProvider";
import { useMoralis, useMoralisQuery, useWeb3ExecuteFunction } from "react-moralis";
import { useEffect, useState, createElement } from "react";
import { Comment, Tooltip, Avatar, message, Divider } from "antd";
import Text from "antd/lib/typography/Text";
import Blockie from "components/Blockie";
import glStyles from "components/gstyles";
import Donations from "./Donations"
import Receivers from "./Receivers";
import Reputation from "components/Reputation";

const Fund = ({fund}) => {
    const {Moralis} = useMoralis();
    const { contentId, fundId, fundOwner, receivers } = fund;
    const [fundContent, setPosContent] = useState({ title: "default", content: "default" });
    const { data } = useMoralisQuery("Contents", (query) => query.equalTo("contentId", contentId));
    const [donationStatus, setDonationStatus] = useState();
    const { data: donations } = useMoralisQuery("Donations", (query) => query.equalTo("fundId", fundId), [], {
        live: true,
    });
    
    const { walletAddress, contractABI, contractAddress, selectedCategory} = useMoralisDapp();
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
            msgValue: Moralis.Units.ETH(amount),
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
        const options = {
            contractAddress: contractAddress,
            functionName: "withdrawFunding",
            abi: contractABIJson,
            params: {
              _fundId: fund["fundId"],
              //Add _ with new contract
              receiver: walletAddress
            },
          };
          await contractProcessor.fetch({
            params: options,
            onSuccess: () => {
                console.log("success");
                clearForm();
            },
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
    const validateAmount = () => {
        let result = donationAmount > 0 ? true: false;
        return result
    }

   const clearForm = () =>{
        setDonation('');
    }
    
    function onSubmit(e){
        e.preventDefault();
        if(!validateForm()){
            return message.error("Remember to add the title, the content, and the receivers of your fundraisers")
        }
        if(!validateAmount()){
            return message.error("You cannot donate nothing to the fundraiser.")
        }
        Donate(donationAmount);
        //clearForm();
    }
    
    const donateForm = () => {
        //should not display if the fund has ended
            return (
            <Tooltip title="Donate to the fundraiser">
                <span style={{ fontSize: "15px", display: "flex", alignItems: "center" }}>      
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
            </Tooltip>
            );
    }

    const retractDonationsButton = () => {
        //should not display if the fund has ended
            return (
                <Tooltip title="Retract all donations given">
                    <span style={{ fontSize: "15px", display: "list-item", alignItems: "center", marginLeft:"320px", marginTop:"20px" }}>
                        {/* This should display the total fundraising given by this user*/}  
                        <button className="btn btn-dark " onClick={() => RetractDonation()}>Retract Donations</button>
                    </span>
                </Tooltip>
            );
    }
    const fundOwnerCapabilites = () => {
        //should not display if the fund has ended
        if(walletAddress === fundOwner){
            return (
                <Tooltip title="End the fundraiser and allow receivers to start withdrawing.">
                    <span style={{marginTop:"0px", marginLeft:"-12px", float:"left" }}>
                        <button className="btn btn-dark " style={{float:"right", marginTop:"10px"}} onClick={() => endFundraiser()}>End Fundraiser</button>
                    </span>
                </Tooltip>
            );
        }
        else return null;
    }

    const receiverCapabilites = () => {
        //should not display if the fund has ended
        if(receivers.find(r => r.toLowerCase() === walletAddress.toLowerCase())){
            return (
                <Tooltip title="Withdraw the donations given to you.">
                    <button className="btn btn-dark " style={{float:"right", marginTop:"10px"}} onClick={() => withrawFunding()}>Withdraw Donated Funds</button>
                </Tooltip>
            );
        }
        else return null;
    }

    const actions = [
    <Tooltip title="The amount raised so far for the fundraiser.">
        <br></br>
        <span style={{ fontSize: "20px", display:"flex", width: "100%", float:"left", marginRight:"100px" }}> 
            Total Donations:
            <Donations fundId={fundId}/>
        </span>
    </Tooltip>,
    <Tooltip title="The addresses who will receive the donations when the fundraiser is complete.">
        <span style={{ fontSize: "12px" }}> 
            Fundraiser Receivers:
            <Receivers fundId={fundId}/>
        </span>
    </Tooltip>,
    donateForm(),
    retractDonationsButton(),
    fundOwnerCapabilites(),
    receiverCapabilites()
    ];  

    const loading = "";
    
    //Add a copy direct link to search a each fundraiser for sharing

    const result = (
        <Comment
        style={{ ...glStyles.card, padding: "0px 15px", marginBottom: "10px" }}
        actions={actions}
        author={<Text strong>{fund["fundOwner"]}</Text>}
        avatar={<Avatar src={<Blockie address={fund["fundOwner"]} scale={4} />}></Avatar>}
        content={
            <>
            <Text strong style={{ fontSize: "12px", color: "#333" }}>
                {"The Organizers Reputation in "} {selectedCategory["category"]} {" is "}
                <Reputation address={fund["fundOwner"]}></Reputation>
                <br></br>
                <br></br>

            </Text>
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
