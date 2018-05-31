"use strict";
const { h, Component, Indent, Text } = require("ink");
const TextInput = require("ink-text-input");
const SelectInput = require("ink-select-input");
const opn = require("opn");
const autoBind = require("auto-bind");
const dns = require("dns");
const axios = require("axios");

const open = url => opn(url, { wait: false });

const handleSelect = item => {
  if (item && item.url) open(item.url);
};

const STAGE_CHECKING = 0;
const STAGE_OFFLINE = 1;
const STAGE_SEARCH = 2;

const OfflineMessage = () => (
  <div>
    <Text bold red>
      ›
    </Text>

    <Text dim>{" Please check your internet connection"}</Text>

    <br />
  </div>
);

const NoResultsMessage = () => (
  <div>
    <Text bold red>
      ›
    </Text>

    <Text dim>
      {" There is no result for your query. Please, type it in another way!"}
    </Text>

    <br />
  </div>
);

const QueryInput = ({ query, placeholder, onChange }) => (
  <div>
    <Text bold>
      <Text cyan>›</Text>{" "}
      <TextInput value={query} placeholder={placeholder} onChange={onChange} />
    </Text>
  </div>
);

const Search = ({ query, results, onChangeQuery }) => {
  const items = results.length
    ? results.map(result => ({
        label: `${result.title} (${result.answer_count} answer/s)`,
        url: result.link
      }))
    : [];

  return (
    <span>
      <Text bold>
        <Text green> Welcome to StackOverflow CLI tool!</Text>
      </Text>
      <br/>
      <br/>
      <QueryInput
        query={query}
        placeholder="Type your question here!"
        onChange={onChangeQuery}
      />

      <br />
      <SelectInput items={items} onSelect={handleSelect} />
      <br />
    </span>
  );
};

class StackOverflow extends Component {
  constructor(props) {
    super(props);
    autoBind(this);

    this.state = {
      stage: STAGE_CHECKING,
      query: "",
      results: []
    };
  }

  render() {
    const { stage, query, results } = this.state;

    return (
      <span>
        <br />

        {stage === STAGE_OFFLINE && <OfflineMessage />}
        {stage === STAGE_SEARCH && (
          <Search
            query={query}
            results={results}
            onChangeQuery={this.handleChangeQuery}
          />
        )}
      </span>
    );
  }

  componentDidMount() {
    dns.lookup("stackexchange.com", err => {
      const stage =
        err && err.code === "ENOTFOUND" ? STAGE_OFFLINE : STAGE_SEARCH;

      this.setState({ stage }, () => {
        if (stage === STAGE_OFFLINE) {
          this.props.onError();
          return;
        }

        process.stdin.on("keypress", this.handleKeyPress);
      });
    });
  }

  handleChangeQuery(query) {
    this.setState({
      query,
      results: []
    });
  }

  handleKeyPress(ch, key = {}) {
    const { onExit } = this.props;
    let { query } = this.state;

    if (key.name === "escape" || (key.ctrl && key.name === "c")) {
      onExit();
      return;
    }

    if (key.name === "return") {
      this.fetchResults(query);
    }
  }

  async fetchResults(query) {
    const urlBase = `https://api.stackexchange.com/2.2/search?order=desc&sort=votes&site=stackoverflow&intitle=`;
    const url = `${urlBase}"${query}"`;
    const response = await axios.get(url);
    const results = response.data.items;

    if (this.state.query.length > 1) {
      this.setState({ results });
    }
  }
}

module.exports = StackOverflow;
