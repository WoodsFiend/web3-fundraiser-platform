import {useMoralisDapp} from "providers/MoralisDappProvider/MoralisDappProvider"
import {Menu } from "antd"
import glStyles from "./gstyles" 
import { useState } from "react";
import queryString from 'query-string';

const Categories = ({categories}) => {
    const { setSelectedCategory, setSelectedFund } = useMoralisDapp();
    const {categoryId, fundId} = queryString.parse(window.location.search);
    const [isSet, SetIsSet] = useState(false);
    function selectCategory(categoryId) {
        const selectedCategory = categories.filter((category) => category["categoryId"] === categoryId);
        //clear search params
        window.history.pushState({}, document.title, "/main");
        setSelectedFund(null);
        setSelectedCategory(selectedCategory[0]);
    }
    
    function SetCategory() {
        if(categories.length > 0 && categoryId){
            let selected = categories.find(c=>c.categoryId === categoryId);
            console.log(selected);
            setSelectedCategory(selected);
            SetIsSet(true);
        }
    }

    return (
        <div className="col-lg-3">
            {!isSet?SetCategory():null}
            <Menu 
            onClick={(e) => selectCategory(e.key)}
            style={{ ...glStyles.card, padding: "10px 0" }} 
            mode="inline">
                <Menu.ItemGroup key="categories" title="Categories">
                    {categories.map((category) => (
                        <Menu.Item key={category["categoryId"]}>{category["category"]}</Menu.Item>
                    ))}
                </Menu.ItemGroup>
            </Menu>
        </div>
    )
}

export default Categories
