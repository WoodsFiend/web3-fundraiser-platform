import { useMoralisDapp } from "providers/MoralisDappProvider/MoralisDappProvider";
import { useMoralisQuery } from "react-moralis";
import Fund from "./Fund";
import queryString from 'query-string';
import { useState } from "react";


const Funds = () => {
    const { selectedCategory, selectedFund, setSelectedFund } = useMoralisDapp();
    const {categoryId, fundId} = queryString.parse(window.location.search);
    const [isSet, SetIsSet] = useState(false);

    const queryFund = useMoralisQuery(
        "Funds",
        (query) => query.equalTo("categoryId", selectedCategory["categoryId"]),
        [selectedCategory],
        { live: true }
      );

    function SetFund() {
        if(fetchedFunds.length > 0 && fundId){
            let selected = fetchedFunds.find(f=>f.fundId === fundId);
            console.log(selected);
            setSelectedFund(selected);
            SetIsSet(true);
        }
    }
    //Add search filters so specific fundraisers can be found

    const fetchedFunds = JSON.parse(JSON.stringify(queryFund.data, ["fundId", "contentId", "fundOwner", "receivers"])).reverse();
    const haveFunds = fetchedFunds.length > 0 ? true : false;

    const emptyResult = (
                        <div>
                            <h3>Be the first to start a fundraiser for</h3>
                            <h3>{selectedCategory["category"]} </h3>
                        </div>
                    );
    
    const fundResult = (<div>
                            {!isSet?SetFund():null}
                            {selectedFund? 
                                <Fund key={fundId} fund={selectedFund} />
                            :fetchedFunds.map((fund) => (
                                <Fund key={fund["fundId"]} fund={fund} />
                            ))}
                        </div>)

    return haveFunds ? fundResult : emptyResult;
}

export default Funds
