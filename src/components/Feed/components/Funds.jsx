import { useMoralisDapp } from "providers/MoralisDappProvider/MoralisDappProvider";
import { useMoralisQuery } from "react-moralis";
import Fund from "./Fund"

const Funds = () => {
    const { selectedCategory } = useMoralisDapp();
    
    const queryFund = useMoralisQuery(
        "Funds",
        (query) => query.equalTo("categoryId", selectedCategory["categoryId"]),
        [selectedCategory],
        { live: true }
      );

    const fetchedFunds = JSON.parse(JSON.stringify(queryFund.data, ["fundId", "contentId", "fundOwner", "receivers"])).reverse();
    const haveFunds = fetchedFunds.length > 0 ? true : false;

    const emptyResult = (
                        <div>
                            <h3>Be the first to start a fund here for</h3>
                            <h3>{selectedCategory["category"]} </h3>
                        </div>
                    );
    
    const fundResult = (<div>
                            {fetchedFunds.map((fund) => (
                                <Fund key={fund["fundId"]} fund={fund} />
                            ))}
                        </div>)

    return haveFunds ? fundResult : emptyResult;
}

export default Funds
